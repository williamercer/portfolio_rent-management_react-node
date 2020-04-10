import { createActions } from 'reduxsauce'

const { Types, Creators } = createActions({
  signInEmail    : ['email', 'password'],
  signUpEmail    : ['email', 'password', 'userType'],
  signInGoogle   : ['idToken'],
  signUpGoogle   : ['idToken', 'userType'],
  signInFacebook : ['accessToken'],
  signUpFacebook : ['accessToken', 'userType'],
  signOut        : [],
  checkToken     : [],
  verifyEmail    : ['token'],
}, { prefix: 'auth_' })

export { Types, Creators }
