const mongoose = require('mongoose')
const crypto = require('crypto')

const tokenSchema = new mongoose.Schema({
  user      : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token     : { type: String, required: true, unique: true },
  createdAt : { type: Date, default: Date.now, expires: 3600 }
})
const Token = mongoose.model('Token', tokenSchema)

Token.createToken = async (userId) => {
  const newToken = await Token({
    user  : userId,
    token : crypto.randomBytes(30).toString('hex')
  }).save()
  return newToken
}

Token.getToken = token => Token.findOne({ token })

module.exports = Token
