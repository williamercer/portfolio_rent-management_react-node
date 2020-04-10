require('dotenv').config({ path: '.test.env' })

const bcrypt     = require('bcrypt')
const sgMail     = require('@sendgrid/mail')
const controller = require('../auth')
const User       = require('../../models/user')
const Token      = require('../../models/token')
const utils      = require('../../utils')
const {
  USER_TYPE,
  AUTH_TYPE,
} = require('../../constants')

jest.mock('@sendgrid/mail', () => ({
  setApiKey : jest.fn(() => true),
  send      : jest.fn(async () => true)
}))
jest.mock('../../utils')

let res
beforeEach(() => {
  res = {}
  res.status = jest.fn(() => res)
  res.json   = jest.fn(() => res)
})

describe('signInEmail controller', () => {
  const email = 'test@test.com'
  const password = 'test'
  const userData = {
    _id           : 'user1',
    email,
    emailVerified : true,
    hash          : bcrypt.hashSync(password, 10),
    userType      : USER_TYPE.CLIENT,
    authType      : AUTH_TYPE.EMAIL
  }
  beforeEach(() => {
    // Mock DB
    User.getEmailUserByEmail = jest.fn(async () => ({
      ...userData,
      toJSON: () => userData,
    }))
  })
  test('returns token and user data if email and password are correct', async () => {
    // Request object
    const req = { body: { email, password } }

    // Call controller
    await controller.signInEmail(req, res)
    expect(User.getEmailUserByEmail).toHaveBeenCalledTimes(1)
    expect(User.getEmailUserByEmail).toHaveBeenCalledWith(email)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      token : expect.any(String),
      user  : expect.any(Object)
    })
  })
  test('returns 400 error if the email is invalid', async () => {
    // Request object
    const req = { body: { email: 'abc', password } }

    // Call controller
    await controller.signInEmail(req, res)
    expect(User.getEmailUserByEmail).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String),
    })
  })
  test('returns 401 error if the password is wrong', async () => {
    // Request object
    const req = { body: { email, password: 'wrong' } }

    // Call controller
    await controller.signInEmail(req, res)
    expect(User.getEmailUserByEmail).toHaveBeenCalledTimes(1)

    // Check response
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String),
    })
  })
  test('returns 403 error if the email is not verified', async () => {
    User.getEmailUserByEmail = jest.fn(async () => ({
      ...userData,
      emailVerified : false,
      toJSON        : () => userData,
    }))
    // Request object
    const req = { body: { email, password } }

    // Call controller
    await controller.signInEmail(req, res)
    expect(User.getEmailUserByEmail).toHaveBeenCalledTimes(1)

    // Check response
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String),
    })
  })
})

describe('signUpEmail controller', () => {
  const email = 'test@test.com'
  const password = 'test'
  const userType = USER_TYPE.CLIENT
  test('create a new user and send email verification link', async () => {
    // Mock DB
    User.getEmailUserByEmail = jest.fn(async () => null)
    User.createUser = jest.fn(async () => ({ _id: 'user1', email }))
    Token.createToken = jest.fn(async () => ({ token: 'email_token' }))

    // Request object
    const req = { body: { email, password, userType } }

    // Call controller
    await controller.signUpEmail(req, res)
    expect(User.getEmailUserByEmail).toHaveBeenCalledTimes(1)
    expect(User.getEmailUserByEmail).toHaveBeenCalledWith(email)
    expect(User.createUser).toHaveBeenCalledWith(expect.objectContaining({ email }))
    expect(Token.createToken).toHaveBeenCalledWith('user1')
    expect(sgMail.setApiKey).toHaveBeenCalledWith(process.env.SENDGRID_API_KEY)
    expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
      to: email
    }))

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })
  test('returns 400 error if the email already exists', async () => {
    // Mock DB
    User.getEmailUserByEmail = jest.fn(async () => ({ email }))
    User.createUser = jest.fn(async () => ({ _id: 'user1', email }))
    Token.createToken = jest.fn(async () => ({ token: 'email_token' }))

    // Request object
    const req = { body: { email, password, userType } }

    // Call controller
    await controller.signUpEmail(req, res)
    expect(User.getEmailUserByEmail).toHaveBeenCalledTimes(1)
    expect(User.getEmailUserByEmail).toHaveBeenCalledWith(email)
    expect(User.createUser).toHaveBeenCalledTimes(0)
    expect(Token.createToken).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
})

describe('signInGoogle controller', () => {
  const googleId = 'google1'
  const userData = {
    _id      : 'user1',
    googleId,
    email    : 'test@google.com',
    userType : USER_TYPE.CLIENT,
    authType : AUTH_TYPE.GOOGLE
  }
  beforeEach(() => {
    // Mock DB
    User.getGoogleUserById = jest.fn(async () => ({
      ...userData,
      toJSON: () => userData,
    }))
  })
  test('returns token and user data if token is valid and the user already exists', async () => {
    utils.verifyGoogleToken = jest.fn(async () => ({ sub: googleId }))
    // Request object
    const req = { body: { idToken: 'googletoken' } }

    // Call controller
    await controller.signInGoogle(req, res)
    expect(utils.verifyGoogleToken).toHaveBeenCalledWith('googletoken')
    expect(User.getGoogleUserById).toHaveBeenCalledTimes(1)
    expect(User.getGoogleUserById).toHaveBeenCalledWith(googleId)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      token : expect.any(String),
      user  : expect.any(Object)
    })
  })
  test('401 error if token is invalid', async () => {
    utils.verifyGoogleToken = jest.fn(async () => {
      throw new Error('mocked error')
    })
    // Request object
    const req = { body: { idToken: 'googletoken' } }

    // Call controller
    await controller.signInGoogle(req, res)
    expect(utils.verifyGoogleToken).toHaveBeenCalledWith('googletoken')
    expect(User.getGoogleUserById).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String),
    })
  })
  test('401 error if token is valid but the user does not exist', async () => {
    utils.verifyGoogleToken = jest.fn(async () => ({ sub: googleId }))
    User.getGoogleUserById = jest.fn(async () => null)
    // Request object
    const req = { body: { idToken: 'googletoken' } }

    // Call controller
    await controller.signInGoogle(req, res)
    expect(utils.verifyGoogleToken).toHaveBeenCalledWith('googletoken')
    expect(User.getGoogleUserById).toHaveBeenCalledWith(googleId)

    // Check response
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String),
    })
  })
})

describe('signUpGoogle controller', () => {
  const googleId = 'google1'
  const userData = {
    _id      : 'user1',
    googleId,
    email    : 'test@google.com',
    userType : USER_TYPE.CLIENT,
    authType : AUTH_TYPE.GOOGLE
  }
  beforeEach(() => {
    // Mock DB
    User.getGoogleUserById = jest.fn(async () => null)
    User.createUser = jest.fn(async () => ({
      ...userData,
      toJSON: () => userData,
    }))
  })
  test('returns token and user data if token is valid and the user does not already exist', async () => {
    utils.verifyGoogleToken = jest.fn(async () => ({ sub: googleId }))
    // Request object
    const req = { body: { idToken: 'googletoken', userType: USER_TYPE.CLIENT } }

    // Call controller
    await controller.signUpGoogle(req, res)
    expect(utils.verifyGoogleToken).toHaveBeenCalledWith('googletoken')
    expect(User.getGoogleUserById).toHaveBeenCalledTimes(1)
    expect(User.getGoogleUserById).toHaveBeenCalledWith(googleId)
    expect(User.createUser).toHaveBeenCalledTimes(1)
    expect(User.createUser).toHaveBeenCalledWith(expect.objectContaining({ googleId }))

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      token : expect.any(String),
      user  : expect.any(Object)
    })
  })
  test('401 error if token is invalid', async () => {
    utils.verifyGoogleToken = jest.fn(async () => {
      throw new Error('mocked error')
    })
    // Request object
    const req = { body: { idToken: 'googletoken', userType: USER_TYPE.CLIENT } }

    // Call controller
    await controller.signUpGoogle(req, res)
    expect(utils.verifyGoogleToken).toHaveBeenCalledWith('googletoken')
    expect(User.getGoogleUserById).toHaveBeenCalledTimes(0)
    expect(User.createUser).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String),
    })
  })
  test('400 error if token is valid but the user already exists', async () => {
    utils.verifyGoogleToken = jest.fn(async () => ({ sub: googleId }))
    User.getGoogleUserById = jest.fn(async () => true)
    // Request object
    const req = { body: { idToken: 'googletoken', userType: USER_TYPE.CLIENT } }

    // Call controller
    await controller.signUpGoogle(req, res)
    expect(utils.verifyGoogleToken).toHaveBeenCalledWith('googletoken')
    expect(User.getGoogleUserById).toHaveBeenCalledWith(googleId)
    expect(User.createUser).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String),
    })
  })
})

describe('signInFacebook controller', () => {
  const facebookId = 'facebook1'
  const userData = {
    _id      : 'user1',
    facebookId,
    email    : 'test@test.com',
    userType : USER_TYPE.CLIENT,
    authType : AUTH_TYPE.FACEBOOK
  }
  beforeEach(() => {
    // Mock DB
    User.getFacebookUserById = jest.fn(async () => ({
      ...userData,
      toJSON: () => userData,
    }))
  })
  test('returns token and user data if token is valid and the user already exists', async () => {
    utils.verifyFacebookToken = jest.fn(async () => ({ id: facebookId }))
    // Request object
    const req = { body: { accessToken: 'facebooktoken' } }

    // Call controller
    await controller.signInFacebook(req, res)
    expect(utils.verifyFacebookToken).toHaveBeenCalledWith('facebooktoken')
    expect(User.getFacebookUserById).toHaveBeenCalledTimes(1)
    expect(User.getFacebookUserById).toHaveBeenCalledWith(facebookId)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      token : expect.any(String),
      user  : expect.any(Object)
    })
  })
  test('401 error if token is invalid', async () => {
    utils.verifyFacebookToken = jest.fn(async () => {
      throw new Error('mocked error')
    })
    // Request object
    const req = { body: { accessToken: 'facebooktoken' } }

    // Call controller
    await controller.signInFacebook(req, res)
    expect(utils.verifyFacebookToken).toHaveBeenCalledWith('facebooktoken')
    expect(User.getFacebookUserById).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String),
    })
  })
  test('401 error if token is valid but the user does not exist', async () => {
    utils.verifyFacebookToken = jest.fn(async () => ({ id: facebookId }))
    User.getFacebookUserById = jest.fn(async () => null)
    // Request object
    const req = { body: { accessToken: 'facebooktoken' } }

    // Call controller
    await controller.signInFacebook(req, res)
    expect(utils.verifyFacebookToken).toHaveBeenCalledWith('facebooktoken')
    expect(User.getFacebookUserById).toHaveBeenCalledWith(facebookId)

    // Check response
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String),
    })
  })
})

describe('signUpFacebook controller', () => {
  const facebookId = 'facebook1'
  const userData = {
    _id      : 'user1',
    facebookId,
    email    : 'test@test.com',
    userType : USER_TYPE.CLIENT,
    authType : AUTH_TYPE.FACEBOOK
  }
  beforeEach(() => {
    // Mock DB
    User.getFacebookUserById = jest.fn(async () => null)
    User.createUser = jest.fn(async () => ({
      ...userData,
      toJSON: () => userData,
    }))
  })
  test('returns token and user data if token is valid and the user does not already exist', async () => {
    utils.verifyFacebookToken = jest.fn(async () => ({ id: facebookId }))
    // Request object
    const req = { body: { accessToken: 'facebooktoken', userType: USER_TYPE.CLIENT } }

    // Call controller
    await controller.signUpFacebook(req, res)
    expect(utils.verifyFacebookToken).toHaveBeenCalledWith('facebooktoken')
    expect(User.getFacebookUserById).toHaveBeenCalledTimes(1)
    expect(User.getFacebookUserById).toHaveBeenCalledWith(facebookId)
    expect(User.createUser).toHaveBeenCalledTimes(1)
    expect(User.createUser).toHaveBeenCalledWith(expect.objectContaining({ facebookId }))

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      token : expect.any(String),
      user  : expect.any(Object)
    })
  })
  test('401 error if token is invalid', async () => {
    utils.verifyFacebookToken = jest.fn(async () => {
      throw new Error('mocked error')
    })
    // Request object
    const req = { body: { accessToken: 'facebooktoken', userType: USER_TYPE.CLIENT } }

    // Call controller
    await controller.signUpFacebook(req, res)
    expect(utils.verifyFacebookToken).toHaveBeenCalledWith('facebooktoken')
    expect(User.getFacebookUserById).toHaveBeenCalledTimes(0)
    expect(User.createUser).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String),
    })
  })
  test('400 error if token is valid but the user already exists', async () => {
    utils.verifyFacebookToken = jest.fn(async () => ({ id: facebookId }))
    User.getFacebookUserById = jest.fn(async () => true)
    // Request object
    const req = { body: { accessToken: 'facebooktoken', userType: USER_TYPE.CLIENT } }

    // Call controller
    await controller.signUpFacebook(req, res)
    expect(utils.verifyFacebookToken).toHaveBeenCalledWith('facebooktoken')
    expect(User.getFacebookUserById).toHaveBeenCalledWith(facebookId)
    expect(User.createUser).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String),
    })
  })
})

describe('checkToken controller', () => {
  test('returns token and user data if the request is authorized', async () => {
    // Request object
    const req = { user: { _id: 'user1' } }

    // Call controller
    await controller.checkToken(req, res)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      token : expect.any(String),
      user  : expect.any(Object)
    })
  })
  test('returns 401 error if the request is not authorized', async () => {
    // Request object
    const req = { }

    // Call controller
    await controller.checkToken(req, res)

    // Check response
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String),
    })
  })
})

describe('verifyEmail controller', () => {
  test('sets emailVerified property of the user', async () => {
    // Mock DB
    const tokenObj = {
      user   : 'user1',
      remove : jest.fn(async () => true)
    }
    const userObj = {
      save: jest.fn(async () => true)
    }
    Token.getToken = jest.fn(async () => tokenObj)
    User.getUserById = jest.fn(async () => userObj)

    // Request object
    const req = { body: { token: 'token1' } }

    // Call controller
    await controller.verifyEmail(req, res)
    expect(Token.getToken).toHaveBeenCalledWith('token1')
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(userObj.emailVerified).toEqual(true)
    expect(userObj.save).toHaveBeenCalledTimes(1)
    expect(tokenObj.remove).toHaveBeenCalledTimes(1)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })
  test('returns 401 if the token is invalid', async () => {
    // Mock DB
    Token.getToken = jest.fn(async () => null)
    User.getUserById = jest.fn(async () => null)

    // Request object
    const req = { body: { token: 'token1' } }

    // Call controller
    await controller.verifyEmail(req, res)
    expect(Token.getToken).toHaveBeenCalledWith('token1')
    expect(User.getUserById).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
  test('returns 404 if it cannot find user', async () => {
    // Mock DB
    Token.getToken = jest.fn(async () => ({ user: 'user1' }))
    User.getUserById = jest.fn(async () => null)

    // Request object
    const req = { body: { token: 'token1' } }

    // Call controller
    await controller.verifyEmail(req, res)
    expect(Token.getToken).toHaveBeenCalledWith('token1')
    expect(User.getUserById).toHaveBeenCalledWith('user1')

    // Check response
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
})
