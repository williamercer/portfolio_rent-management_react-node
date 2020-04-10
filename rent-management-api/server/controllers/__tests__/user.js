require('dotenv').config({ path: '.test.env' })

const bcrypt     = require('bcrypt')
const controller = require('../user')
const User       = require('../../models/user')
const Apartment  = require('../../models/apartment')
const {
  USER_TYPE,
  AUTH_TYPE
} = require('../../constants')

let res
beforeEach(() => {
  res = {}
  res.status = jest.fn(() => res)
  res.json   = jest.fn(() => res)
})

describe('createUser controller', () => {
  const userData = {
    email         : 'user@test.com',
    emailVerified : true,
    password      : '23',
    userType      : USER_TYPE.CLIENT
  }
  beforeEach(() => {
    // Mock DB
    User.getEmailUserByEmail = jest.fn(async () => null)
    User.createUser = jest.fn(async () => ({
      ...userData,
      toJSON: () => userData,
    }))
  })
  test('creates a new user and return its data', async () => {
    // Request object
    const req = {
      user : { _id: 'user1', userType: USER_TYPE.ADMIN },
      body : { ...userData }
    }

    // Call controller
    await controller.createUser(req, res)
    expect(User.getEmailUserByEmail).toHaveBeenCalledWith('user@test.com')
    expect(User.createUser).toHaveBeenCalledTimes(1)
    expect(User.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email    : 'user@test.com',
      userType : USER_TYPE.CLIENT,
      authType : AUTH_TYPE.EMAIL,
      hash     : expect.any(String),
    }))

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      user: expect.any(Object)
    })
  })
  test('returns 400 error if email already exists', async () => {
    // Mock DB
    User.getEmailUserByEmail = jest.fn(async () => true)
    // Request object
    const req = {
      user : { _id: 'user1', userType: USER_TYPE.ADMIN },
      body : { ...userData }
    }

    // Call controller
    await controller.createUser(req, res)
    expect(User.getEmailUserByEmail).toHaveBeenCalledWith('user@test.com')
    expect(User.createUser).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
  test('returns 403 error if it does not have admin permission', async () => {
    // Request object
    const req = {
      user : { _id: 'user1', userType: USER_TYPE.CLIENT },
      body : { ...userData }
    }

    // Call controller
    await controller.createUser(req, res)
    expect(User.getEmailUserByEmail).toHaveBeenCalledTimes(0)
    expect(User.createUser).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
  test('returns 400 error if request body misses some fields', async () => {
    // Request object
    const req = {
      user : { _id: 'user1', userType: USER_TYPE.CLIENT },
      body : { email: 'user@test.com' }
    }

    // Call controller
    await controller.createUser(req, res)
    expect(User.getEmailUserByEmail).toHaveBeenCalledTimes(0)
    expect(User.createUser).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
})

describe('getSelf controller', () => {
  test('returns current authed user data', async () => {
    // Request object
    const req = {
      user: { _id: 'user1', userType: USER_TYPE.ADMIN },
    }

    // Call controller
    await controller.getSelf(req, res)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      user: expect.objectContaining({ _id: 'user1' })
    })
  })
})

describe('deleteSelf controller', () => {
  beforeEach(() => {
    // Mock DB
    Apartment.deleteApartments = jest.fn(async () => true)
  })
  test('deletes the user and all of its apartments', async () => {
    // Mock DB
    const userObj = {
      _id    : 'user1',
      remove : jest.fn(async () => true)
    }
    User.getUserById = jest.fn(async () => userObj)
    // Request object
    const req = {
      user: { _id: 'user1' },
    }

    // Call controller
    await controller.deleteSelf(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(Apartment.deleteApartments).toHaveBeenCalledWith('user1')
    expect(userObj.remove).toHaveBeenCalledTimes(1)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })
  test('returns 404 error if it cannot find the user object', async () => {
    // Mock DB
    User.getUserById = jest.fn(async () => null)
    // Request object
    const req = {
      user: { _id: 'user1' },
    }

    // Call controller
    await controller.deleteSelf(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(Apartment.deleteApartments).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
})

describe('changePassword controller', () => {
  let userObj
  beforeEach(() => {
    // Mock DB
    userObj = {
      _id      : 'user1',
      authType : AUTH_TYPE.EMAIL,
      hash     : bcrypt.hashSync('old_pass', 10),
      save     : jest.fn(async () => true)
    }
    User.getUserById = jest.fn(async () => userObj)
  })
  test('check old password and set a new password', async () => {
    // Request object
    const req = {
      user : { _id: 'user1' },
      body : { old: 'old_pass', password: 'new_pass' }
    }

    // Call controller
    await controller.changePassword(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(userObj.save).toHaveBeenCalledTimes(1)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })
  test('returns 400 error if auth type is not email/password', async () => {
    // Mock DB
    User.getUserById = jest.fn(async () => ({ authType: AUTH_TYPE.GOOGLE }))

    // Request object
    const req = {
      user : { _id: 'user1' },
      body : { old: 'old_pass', password: 'new_pass' }
    }

    // Call controller
    await controller.changePassword(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
  test('returns 403 error if old password is wrong', async () => {
    // Request object
    const req = {
      user : { _id: 'user1' },
      body : { old: 'wrong_pass', password: 'new_pass' }
    }

    // Call controller
    await controller.changePassword(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(userObj.save).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
})

describe('listUsers controller', () => {
  beforeEach(() => {
    // Mock DB
    User.countUsers = jest.fn(async () => 5)
    User.listUsers = jest.fn(async () => [{}, {}])
  })
  test('returns totalCounts and users according to the query', async () => {
    // Request object
    const req = {
      user  : { _id: 'user1', userType: USER_TYPE.ADMIN },
      query : { before: '2020', pageSize: 30 }
    }

    // Call controller
    await controller.listUsers(req, res)
    const dbQuery = { createdAt: { $lt: expect.any(Date) } }
    expect(User.countUsers).toHaveBeenCalledWith(dbQuery)
    expect(User.listUsers).toHaveBeenCalledWith(dbQuery, 30)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      totalCounts : 5,
      users       : expect.any(Array)
    })
  })
  test('returns 403 if request does not have admin permission', async () => {
    // Request object
    const req = {
      user  : { _id: 'user1', userType: USER_TYPE.CLIENT },
      query : { before: '2020', pageSize: 30 }
    }

    // Call controller
    await controller.listUsers(req, res)
    expect(User.countUsers).toHaveBeenCalledTimes(0)
    expect(User.listUsers).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
})

describe('deleteUser controller', () => {
  beforeEach(() => {
    // Mock DB
    Apartment.deleteApartments = jest.fn(async () => true)
  })
  test('deletes the user and all of its apartments', async () => {
    // Mock DB
    const userObj = {
      _id    : 'user1',
      remove : jest.fn(async () => true)
    }
    User.getUserById = jest.fn(async () => userObj)
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.ADMIN },
      params : { userId: 'user1' }
    }

    // Call controller
    await controller.deleteUser(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(Apartment.deleteApartments).toHaveBeenCalledWith('user1')
    expect(userObj.remove).toHaveBeenCalledTimes(1)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ userId: 'user1' })
  })
  test('returns 403 if the request does not have admin permission', async () => {
    // Mock DB
    const userObj = {
      _id    : 'user1',
      remove : jest.fn(async () => true)
    }
    User.getUserById = jest.fn(async () => userObj)
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.REALTOR },
      params : { userId: 'user1' }
    }

    // Call controller
    await controller.deleteUser(req, res)
    expect(User.getUserById).toHaveBeenCalledTimes(0)
    expect(Apartment.deleteApartments).toHaveBeenCalledTimes(0)
    expect(userObj.remove).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
  test('returns 400 if it tries to delete himself', async () => {
    // Mock DB
    const userObj = {
      _id    : 'user1',
      remove : jest.fn(async () => true)
    }
    User.getUserById = jest.fn(async () => userObj)
    // Request object
    const req = {
      user   : { _id: 'user1', userType: USER_TYPE.ADMIN },
      params : { userId: 'user1' }
    }

    // Call controller
    await controller.deleteUser(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(userObj.remove).toHaveBeenCalledTimes(0)
    expect(Apartment.deleteApartments).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
})

describe('editUser controller', () => {
  test('updates email and userType of the user', async () => {
    // Mock DB
    const userObj = {
      _id      : 'user1',
      authType : AUTH_TYPE.EMAIL,
      save     : jest.fn(async () => true),
      toJSON   : jest.fn(async () => ({ _id: 'user1' }))
    }
    User.getUserById = jest.fn(async () => userObj)
    User.getEmailUserByEmail = jest.fn(async () => null)
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.ADMIN },
      params : { userId: 'user1' },
      body   : {
        email    : 'new@user.com',
        userType : USER_TYPE.REALTOR
      }
    }

    // Call controller
    await controller.editUser(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(User.getEmailUserByEmail).toHaveBeenCalledWith('new@user.com')
    expect(userObj.email).toEqual('new@user.com')
    expect(userObj.userType).toEqual(USER_TYPE.REALTOR)
    expect(userObj.save).toHaveBeenCalledTimes(1)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      userId  : 'user1',
      updated : expect.any(Object)
    })
  })
  test('returns 400 error if email already exists', async () => {
    // Mock DB
    const userObj = {
      _id      : 'user1',
      authType : AUTH_TYPE.EMAIL,
      save     : jest.fn(async () => true),
      toJSON   : jest.fn(async () => ({ _id: 'user1' }))
    }
    User.getUserById = jest.fn(async () => userObj)
    User.getEmailUserByEmail = jest.fn(async () => true)
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.ADMIN },
      params : { userId: 'user1' },
      body   : {
        email    : 'new@user.com',
        userType : USER_TYPE.REALTOR
      }
    }

    // Call controller
    await controller.editUser(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(User.getEmailUserByEmail).toHaveBeenCalledWith('new@user.com')
    expect(userObj.save).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
  test('returns 403 error if the request does not have admin permission', async () => {
    // Mock DB
    const userObj = {
      _id      : 'user1',
      authType : AUTH_TYPE.EMAIL,
      save     : jest.fn(async () => true),
      toJSON   : jest.fn(async () => ({ _id: 'user1' }))
    }
    User.getUserById = jest.fn(async () => userObj)
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.REALTOR },
      params : { userId: 'user1' },
      body   : {
        email    : 'new@user.com',
        userType : USER_TYPE.REALTOR
      }
    }

    // Call controller
    await controller.editUser(req, res)
    expect(User.getUserById).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
  test('returns 400 error if invalid email is provided', async () => {
    // Mock DB
    const userObj = {
      _id      : 'user1',
      authType : AUTH_TYPE.EMAIL,
      save     : jest.fn(async () => true),
      toJSON   : jest.fn(async () => ({ _id: 'user1' }))
    }
    User.getUserById = jest.fn(async () => userObj)
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.ADMIN },
      params : { userId: 'user1' },
      body   : {
        email    : 'invalid email',
        userType : USER_TYPE.REALTOR
      }
    }

    // Call controller
    await controller.editUser(req, res)
    expect(User.getUserById).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
  test('updates facebookId of the user', async () => {
    // Mock DB
    const userObj = {
      _id      : 'user1',
      authType : AUTH_TYPE.FACEBOOK,
      save     : jest.fn(async () => true),
      toJSON   : jest.fn(async () => ({ _id: 'user1' }))
    }
    User.getUserById = jest.fn(async () => userObj)
    User.getFacebookUserById = jest.fn(async () => null)
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.ADMIN },
      params : { userId: 'user1' },
      body   : { facebookId: 'facebook1' }
    }

    // Call controller
    await controller.editUser(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(User.getFacebookUserById).toHaveBeenCalledWith('facebook1')
    expect(userObj.facebookId).toEqual('facebook1')
    expect(userObj.save).toHaveBeenCalledTimes(1)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      userId  : 'user1',
      updated : expect.any(Object)
    })
  })
  test('returns 400 if facebookId already exists', async () => {
    // Mock DB
    const userObj = {
      _id      : 'user1',
      authType : AUTH_TYPE.FACEBOOK,
      save     : jest.fn(async () => true),
      toJSON   : jest.fn(async () => ({ _id: 'user1' }))
    }
    User.getUserById = jest.fn(async () => userObj)
    User.getFacebookUserById = jest.fn(async () => true)
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.ADMIN },
      params : { userId: 'user1' },
      body   : { facebookId: 'facebook1' }
    }

    // Call controller
    await controller.editUser(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(User.getFacebookUserById).toHaveBeenCalledWith('facebook1')
    expect(userObj.save).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
  test('updates googleId of the user', async () => {
    // Mock DB
    const userObj = {
      _id      : 'user1',
      authType : AUTH_TYPE.GOOGLE,
      save     : jest.fn(async () => true),
      toJSON   : jest.fn(async () => ({ _id: 'user1' }))
    }
    User.getUserById = jest.fn(async () => userObj)
    User.getGoogleUserById = jest.fn(async () => null)
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.ADMIN },
      params : { userId: 'user1' },
      body   : { googleId: 'google1' }
    }

    // Call controller
    await controller.editUser(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(User.getGoogleUserById).toHaveBeenCalledWith('google1')
    expect(userObj.googleId).toEqual('google1')
    expect(userObj.save).toHaveBeenCalledTimes(1)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      userId  : 'user1',
      updated : expect.any(Object)
    })
  })
  test('returns 400 if googleId already exists', async () => {
    // Mock DB
    const userObj = {
      _id      : 'user1',
      authType : AUTH_TYPE.GOOGLE,
      save     : jest.fn(async () => true),
      toJSON   : jest.fn(async () => ({ _id: 'user1' }))
    }
    User.getUserById = jest.fn(async () => userObj)
    User.getGoogleUserById = jest.fn(async () => true)
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.ADMIN },
      params : { userId: 'user1' },
      body   : { googleId: 'google1' }
    }

    // Call controller
    await controller.editUser(req, res)
    expect(User.getUserById).toHaveBeenCalledWith('user1')
    expect(User.getGoogleUserById).toHaveBeenCalledWith('google1')
    expect(userObj.save).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({ err: expect.any(String) })
  })
})
