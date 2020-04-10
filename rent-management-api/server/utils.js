const requestPromise   = require('request-promise')
const { OAuth2Client } = require('google-auth-library')
const config           = require('./config')

const utils = {}

utils.getLocationFromAddress = async (address) => {
  const { results, status } = await requestPromise({
    method : 'GET',
    uri    : 'https://maps.googleapis.com/maps/api/geocode/json',
    qs     : {
      address,
      key: process.env.GOOGLE_API_KEY
    },
    json: true
  })
  if (status === 'OK'
    && results.length > 0
    && results[0].geometry
  ) {
    return {
      latitude  : results[0].geometry.location.lat,
      longitude : results[0].geometry.location.lng
    }
  }
  throw new Error('Invalid address')
}

utils.verifyGoogleToken = async (idToken) => {
  const client = new OAuth2Client(config.googleClientId)
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.googleClientId
  })
  return ticket.getPayload()
}

utils.verifyFacebookToken = access_token => requestPromise({
  method : 'GET',
  uri    : 'https://graph.facebook.com/me',
  qs     : {
    fields: ['id', 'email'].join(','),
    access_token
  },
  json: true
})

module.exports = utils
