const Joi       = require('@hapi/joi')
const bcrypt    = require('bcrypt')
const jsonSpec  = require('json-spec')
const User      = require('../models/user')
const Apartment = require('../models/apartment')
const config    = require('../config')
const {
  USER_TYPE,
  AUTH_TYPE,
  USER_SPEC
} = require('../constants')

const controller = {}

controller.createUser = async (req, res) => {
  const schema = Joi.object({
    email         : Joi.string().email().required(),
    emailVerified : Joi.boolean().required(),
    password      : Joi.string().required(),
    userType      : Joi.string().valid(...Object.values(USER_TYPE)).required()
  })
  const { error, value } = schema.validate(req.body)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }
  value.email = value.email.toLowerCase().trim()

  // req.user should be admin
  if (req.user.userType !== USER_TYPE.ADMIN) {
    res.status(403).json({ err: 'No permission' })
    return
  }

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
      emailVerified : value.emailVerified,
      hash          : bcrypt.hashSync(value.password, 10),
      userType      : value.userType,
      authType      : AUTH_TYPE.EMAIL
    })

    // Return
    const userData = jsonSpec(newUser.toJSON(), USER_SPEC)
    res.json({ user: userData })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.getSelf = (req, res) => {
  res.json({ user: req.user })
}

controller.deleteSelf = async (req, res) => {
  try {
    // Get user object
    const userObj = await User.getUserById(req.user._id)
    if (!userObj) {
      res.status(404).json({ err: 'Cannot find user' })
      return
    }

    // Delete apartments
    await Apartment.deleteApartments(userObj._id)
    // Delete user
    await userObj.remove()

    // Return
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.changePassword = async (req, res) => {
  const schema = Joi.object({
    old      : Joi.string().required(),
    password : Joi.string().required(),
  })
  const { error, value } = schema.validate(req.body)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }

  try {
    // Get user object
    const userObj = await User.getUserById(req.user._id)
    if (!userObj) {
      res.status(404).json({ err: 'Cannot find user' })
      return
    }
    // User's auth type should be email
    if (userObj.authType !== AUTH_TYPE.EMAIL) {
      res.status(400).json({ err: 'Invalid request' })
      return
    }
    // Compare old password
    if (bcrypt.compareSync(value.old, userObj.hash) !== true) {
      res.status(403).json({ err: 'Wrong password' })
      return
    }

    // Update user password
    userObj.hash = bcrypt.hashSync(value.password, 10)
    await userObj.save()

    // Return
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.listUsers = async (req, res) => {
  const schema = Joi.object({
    before   : Joi.date().optional(),
    pageSize : Joi.number()
      .integer()
      .positive()
      .max(config.maxPageSize)
      .optional(),
  })
  const { error, value } = schema.validate(req.query)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }

  // req.user should be admin
  if (req.user.userType !== USER_TYPE.ADMIN) {
    res.status(403).json({ err: 'No permission' })
    return
  }

  try {
    const dbQuery = {}
    if (value.before) {
      dbQuery.createdAt = { $lt: value.before }
    }
    const totalCounts = await User.countUsers(dbQuery)
    const users = await User.listUsers(
      dbQuery, value.pageSize || config.defaultPageSize
    )

    // Return
    res.json({
      totalCounts,
      users: jsonSpec(users, [USER_SPEC]),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.deleteUser = async (req, res) => {
  // req.user should be admin
  if (req.user.userType !== USER_TYPE.ADMIN) {
    res.status(403).json({ err: 'No permission' })
    return
  }

  try {
    // Get user object
    const userObj = await User.getUserById(req.params.userId)
    if (!userObj) {
      res.status(404).json({ err: 'Cannot find user' })
      return
    }
    // Cannot delete himself
    if (userObj._id.toString() === req.user._id) {
      res.status(400).json({ err: 'Invalid request' })
      return
    }

    // Delete apartments
    await Apartment.deleteApartments(userObj._id)
    // Delete user
    await userObj.remove()

    // Return
    res.json({ userId: req.params.userId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.editUser = async (req, res) => {
  const schema = Joi.object({
    facebookId    : Joi.string().optional(),
    googleId      : Joi.string().optional(),
    email         : Joi.string().email().optional(),
    emailVerified : Joi.boolean().optional(),
    password      : Joi.string().optional(),
    userType      : Joi.string().valid(...Object.values(USER_TYPE)).optional()
  })
  const { error, value } = schema.validate(req.body)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }
  if (value.email) {
    value.email = value.email.toLowerCase().trim()
  }

  // req.user should be admin
  if (req.user.userType !== USER_TYPE.ADMIN) {
    res.status(403).json({ err: 'No permission' })
    return
  }

  try {
    // Get user object
    const { userId } = req.params
    const userObj = await User.getUserById(userId)
    if (!userObj) {
      res.status(404).json({ err: 'Cannot find user' })
      return
    }

    // facebookId
    if (value.facebookId && value.facebookId !== userObj.facebookId) {
      if (userObj.authType !== AUTH_TYPE.FACEBOOK) {
        res.status(400).json({ err: 'Invalid request' })
        return
      }
      const existingUser = await User.getFacebookUserById(value.facebookId)
      if (existingUser) {
        res.status(400).json({ err: 'UserID already exists' })
        return
      }
      userObj.facebookId = value.facebookId
    }
    // googleId
    if (value.googleId && value.googleId !== userObj.googleId) {
      if (userObj.authType !== AUTH_TYPE.GOOGLE) {
        res.status(400).json({ err: 'Invalid request' })
        return
      }
      const existingUser = await User.getGoogleUserById(value.googleId)
      if (existingUser) {
        res.status(400).json({ err: 'UserID already exists' })
        return
      }
      userObj.googleId = value.googleId
    }
    // email
    if (value.email && value.email !== userObj.email) {
      if (userObj.authType === AUTH_TYPE.EMAIL) {
        const existingUser = await User.getEmailUserByEmail(value.email)
        if (existingUser) {
          res.status(400).json({ err: 'Email already exists' })
          return
        }
      }
      userObj.email = value.email
    }
    // emailVerified
    if (typeof value.emailVerified === 'boolean' && value.emailVerified !== userObj.emailVerified) {
      if (userObj.authType !== AUTH_TYPE.EMAIL) {
        res.status(400).json({ err: 'Invalid request' })
        return
      }
      if (userObj._id.toString() === req.user._id) {
        res.status(400).json({ err: 'Invalid request' })
        return
      }
      userObj.emailVerified = value.emailVerified
    }
    // password
    if (value.password) {
      if (userObj.authType !== AUTH_TYPE.EMAIL) {
        res.status(400).json({ err: 'Invalid request' })
        return
      }
      userObj.hash = bcrypt.hashSync(value.password, 10)
    }
    // userType
    if (value.userType && value.userType !== userObj.userType) {
      if (userObj._id.toString() === req.user._id) {
        res.status(400).json({ err: 'Invalid request' })
        return
      }
      userObj.userType = value.userType
    }
    // Save
    await userObj.save()

    // Return
    res.json({
      userId  : userObj._id,
      updated : jsonSpec(userObj.toJSON(), USER_SPEC)
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

module.exports = controller
