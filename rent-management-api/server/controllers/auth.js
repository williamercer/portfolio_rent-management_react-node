const Joi      = require('@hapi/joi')
const bcrypt   = require('bcrypt')
const jwt      = require('jsonwebtoken')
const jsonSpec = require('json-spec')
const sgMail   = require('@sendgrid/mail')
const User     = require('../models/user')
const Token    = require('../models/token')
const utils    = require('../utils')
const config   = require('../config')
const {
  USER_TYPE,
  AUTH_TYPE,
  USER_SPEC
} = require('../constants')

const controller = {}

controller.signInEmail = async (req, res) => {
  const schema = Joi.object({
    email    : Joi.string().email().required(),
    password : Joi.string().required()
  })
  const { error, value } = schema.validate(req.body)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }
  value.email = value.email.toLowerCase().trim()

  try {
    const userObj = await User.getEmailUserByEmail(value.email)
    if (!userObj) {
      res.status(401).json({ err: 'Email or password is invalid' })
      return
    }
    // Compare password
    if (bcrypt.compareSync(value.password, userObj.hash) !== true) {
      res.status(401).json({ err: 'Email or password is invalid' })
      return
    }
    // Check if email verified
    if (!userObj.emailVerified) {
      res.status(403).json({ err: 'Email is not verified yet' })
      return
    }

    // Generate token
    const userData = jsonSpec(userObj.toJSON(), USER_SPEC)
    const token = jwt.sign(userData, process.env.JWT_SECRET, config.jwt)

    // Return
    res.json({
      token,
      user: userData
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.signUpEmail = async (req, res) => {
  const schema = Joi.object({
    email    : Joi.string().email().required(),
    password : Joi.string().required(),
    userType : Joi.string().valid(USER_TYPE.CLIENT, USER_TYPE.REALTOR).required()
  })
  const { error, value } = schema.validate(req.body)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }
  value.email = value.email.toLowerCase().trim()

  try {
    // Check if the email already exists
    const existingUser = await User.getEmailUserByEmail(value.email)
    if (existingUser) {
      res.status(400).json({ err: 'Email already exists' })
      return
    }

    // Create new user
    const newUser = await User.createUser({
      email         : value.email,
      emailVerified : false,
      hash          : bcrypt.hashSync(value.password, 10),
      userType      : value.userType,
      authType      : AUTH_TYPE.EMAIL
    })

    // Generate email token
    const emailToken = await Token.createToken(newUser._id)
    const msg = {
      to      : value.email,
      from    : 'test.admin@apartments.com',
      subject : 'Email verification',
      html    : `Click <a href="${config.frontend}/verify-email/${emailToken.token}">here</a> to verify your email`,
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    await sgMail.send(msg)

    // Return
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ err: 'Server error' })
  }
}

controller.signInGoogle = async (req, res) => {
  const schema = Joi.object({
    idToken: Joi.string().required()
  })
  const { error, value } = schema.validate(req.body)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }

  // Check google token
  let googlePayload
  try {
    googlePayload = await utils.verifyGoogleToken(value.idToken)
  } catch (err) {
    res.status(401).json({ err: 'Invalid token' })
    return
  }

  try {
    const googleId = googlePayload.sub
    // Get user
    const userObj = await User.getGoogleUserById(googleId)
    if (!userObj) {
      res.status(401).json({ err: 'Cannot find user' })
      return
    }

    // Generate token
    const userData = jsonSpec(userObj.toJSON(), USER_SPEC)
    const token = jwt.sign(userData, process.env.JWT_SECRET, config.jwt)

    // Return
    res.json({ token, user: userData })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.signUpGoogle = async (req, res) => {
  const schema = Joi.object({
    idToken  : Joi.string().required(),
    userType : Joi.string().valid(USER_TYPE.CLIENT, USER_TYPE.REALTOR).required()
  })
  const { error, value } = schema.validate(req.body)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }

  // Check google token
  let googlePayload
  try {
    googlePayload = await utils.verifyGoogleToken(value.idToken)
  } catch (err) {
    res.status(401).json({ err: 'Invalid token' })
    return
  }

  try {
    const googleId = googlePayload.sub
    // Check if the user already exists
    const existingUser = await User.getGoogleUserById(googleId)
    if (existingUser) {
      res.status(400).json({ err: 'User already exists' })
      return
    }

    // Create new user
    const newUser = await User.createUser({
      googleId,
      email    : googlePayload.email,
      userType : value.userType,
      authType : AUTH_TYPE.GOOGLE
    })

    // Generate token
    const userData = jsonSpec(newUser.toJSON(), USER_SPEC)
    const token = jwt.sign(userData, process.env.JWT_SECRET, config.jwt)

    // Return
    res.json({
      token,
      user: userData
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.signInFacebook = async (req, res) => {
  const schema = Joi.object({
    accessToken: Joi.string().required(),
  })
  const { error, value } = schema.validate(req.body)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }

  // Check facebook token
  let facebookData
  try {
    facebookData = await utils.verifyFacebookToken(value.accessToken)
  } catch (err) {
    console.log('facebook error', err)
    res.status(401).json({ err: 'Invalid token' })
    return
  }

  try {
    const facebookId = facebookData.id
    // Get user
    const userObj = await User.getFacebookUserById(facebookId)
    if (!userObj) {
      res.status(401).json({ err: 'Cannot find user' })
      return
    }

    // Generate token
    const userData = jsonSpec(userObj.toJSON(), USER_SPEC)
    const token = jwt.sign(userData, process.env.JWT_SECRET, config.jwt)

    // Return
    res.json({ token, user: userData })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.signUpFacebook = async (req, res) => {
  const schema = Joi.object({
    accessToken : Joi.string().required(),
    userType    : Joi.string().valid(USER_TYPE.CLIENT, USER_TYPE.REALTOR).required()
  })
  const { error, value } = schema.validate(req.body)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }

  // Check facebook token
  let facebookData
  try {
    facebookData = await utils.verifyFacebookToken(value.accessToken)
  } catch (err) {
    console.log('facebook error', err)
    res.status(401).json({ err: 'Invalid token' })
    return
  }

  try {
    const facebookId = facebookData.id
    // Check if the user already exists
    const existingUser = await User.getFacebookUserById(facebookId)
    if (existingUser) {
      res.status(400).json({ err: 'User already exists' })
      return
    }

    // Create new user
    const newUser = await User.createUser({
      facebookId,
      email    : facebookData.email,
      userType : value.userType,
      authType : AUTH_TYPE.FACEBOOK
    })

    // Generate token
    const userData = jsonSpec(newUser.toJSON(), USER_SPEC)
    const token = jwt.sign(userData, process.env.JWT_SECRET, config.jwt)

    // Return
    res.json({
      token,
      user: userData
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.checkToken = (req, res) => {
  if (req.user) {
    const token = jwt.sign(req.user, process.env.JWT_SECRET, config.jwt)
    res.json({
      token,
      user: req.user
    })
  } else {
    res.status(401).json({ err: 'Invalid token' })
  }
}

controller.verifyEmail = async (req, res) => {
  const schema = Joi.object({
    token: Joi.string().required(),
  })
  const { error, value } = schema.validate(req.body)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }

  try {
    // Check token
    const tokenObj = await Token.getToken(value.token)
    if (!tokenObj) {
      res.status(401).json({ err: 'Invalid token' })
      return
    }

    // Get user
    const userObj = await User.getUserById(tokenObj.user)
    if (!userObj) {
      res.status(404).json({ err: 'Cannot find user' })
      return
    }

    // Update user
    userObj.emailVerified = true
    await userObj.save()

    // Delete token
    await tokenObj.remove()

    // Return
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

module.exports = controller
