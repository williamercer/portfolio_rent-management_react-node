const router     = require('express').Router()
const controller = require('../controllers/auth')

router.post('/sign-in/email', controller.signInEmail)

router.post('/sign-up/email', controller.signUpEmail)

router.post('/sign-in/google', controller.signInGoogle)

router.post('/sign-up/google', controller.signUpGoogle)

router.post('/sign-in/facebook', controller.signInFacebook)

router.post('/sign-up/facebook', controller.signUpFacebook)

router.get('/check-token', controller.checkToken)

router.post('/verify-email', controller.verifyEmail)

module.exports = router
