const express    = require('express')
const logger     = require('morgan')
const bodyParser = require('body-parser')
const fs         = require('fs')
const cors       = require('cors')
const jwt        = require('jsonwebtoken')
const jsonSpec   = require('json-spec')
const join       = require('path').join
const {
  USER_SPEC
} = require('./server/constants')

const app = express()
app.use(cors())
app.use(logger('dev'))
app.use(bodyParser.json({ limit: '100mb' }))
app.use(bodyParser.urlencoded({ limit: '100mb', extended: false }))

// Load DB models
/* eslint-disable */
const models = join(__dirname, 'server/models')
fs.readdirSync(models)
  .filter(file => ~file.search(/^[^\.].*\.js$/))
  .forEach(file => require(join(models, file)))
/* eslint-enable */

app.use(async (req, res, next) => {
  // Authorization: Bearer <token>
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET)
      req.user = jsonSpec(decoded, USER_SPEC)
    }
  } catch (err) {
    // nothing to do
  }
  next()
})

// Load routes
/* eslint-disable */
const routes = join(__dirname, 'server/routes')
fs.readdirSync(routes)
  .filter(file => ~file.search(/^[^\.].*\.js$/))
  .forEach(file => {
    const routeName = file.split('.')[0]
    app.use(`/${routeName}`, require(join(routes, file)) )
  })
/* eslint-enable */

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers
app.use((err, req, res) => {
  res.status(err.status || 500)
  res.json({ err })
})

module.exports = app
