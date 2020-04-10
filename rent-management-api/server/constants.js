module.exports.USER_TYPE = {
  CLIENT  : 'client',
  REALTOR : 'realtor',
  ADMIN   : 'admin'
}

module.exports.AUTH_TYPE = {
  EMAIL    : 'email',
  GOOGLE   : 'google',
  FACEBOOK : 'facebook'
}

module.exports.USER_SPEC = {
  _id           : true,
  facebookId    : true,
  googleId      : true,
  email         : true,
  emailVerified : true,
  userType      : true,
  authType      : true,
  createdAt     : true
}

module.exports.APARTMENT_SPEC = {
  _id         : true,
  name        : true,
  description : true,
  size        : true,
  price       : true,
  rooms       : true,
  latitude    : true,
  longitude   : true,
  address     : true,
  state       : true,
  createdAt   : true,
  realtor     : {
    _id   : true,
    email : true,
  }
}

module.exports.APARTMENT_STATE = {
  RENTABLE : 'rentable',
  RENTED   : 'rented'
}
