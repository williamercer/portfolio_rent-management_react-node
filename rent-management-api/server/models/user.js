const mongoose = require('mongoose')
const {
  USER_TYPE,
  AUTH_TYPE
} = require('../constants')

const userSchema = new mongoose.Schema({
  facebookId    : { type: String },
  googleId      : { type: String },
  email         : { type: String },
  emailVerified : { type: Boolean, default: false },
  hash          : { type: String },
  userType      : {
    type     : String,
    enum     : Object.values(USER_TYPE),
    required : true,
    default  : USER_TYPE.CLIENT
  },
  authType: {
    type     : String,
    enum     : Object.values(AUTH_TYPE),
    required : true,
    default  : AUTH_TYPE.EMAIL
  },
  createdAt: { type: Date, default: Date.now }
})
const User = mongoose.model('User', userSchema)

User.createUser = async (data) => {
  const newUser = await User(data).save()
  return newUser
}

User.getEmailUserByEmail = email => User.findOne({
  email,
  authType: AUTH_TYPE.EMAIL
})

User.getGoogleUserById = googleId => User.findOne({
  googleId,
  authType: AUTH_TYPE.GOOGLE
})

User.getFacebookUserById = facebookId => User.findOne({
  facebookId,
  authType: AUTH_TYPE.FACEBOOK
})

User.getUserById = userId => User.findById(userId)

User.countUsers = dbQuery => User.countDocuments(dbQuery)

User.listUsers = (dbQuery, pageSize) => User
  .find(dbQuery)
  .sort('-createdAt')
  .limit(pageSize)
  .lean()

module.exports = User
