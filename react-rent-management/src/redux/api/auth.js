import callApi from '../utils/callApi'
import { Types } from '../actions/auth'

const apis = {}

apis[Types.CHECK_TOKEN] = async () => callApi(
  'GET',
  '/auth/check-token'
)

apis[Types.SIGN_IN_EMAIL] = async action => callApi(
  'POST',
  '/auth/sign-in/email',
  {
    email    : action.email,
    password : action.password
  }
)

apis[Types.SIGN_UP_EMAIL] = async action => callApi(
  'POST',
  '/auth/sign-up/email',
  {
    email    : action.email,
    password : action.password,
    userType : action.userType
  }
)

apis[Types.SIGN_IN_GOOGLE] = async action => callApi(
  'POST',
  '/auth/sign-in/google',
  { idToken: action.idToken }
)

apis[Types.SIGN_UP_GOOGLE] = async action => callApi(
  'POST',
  '/auth/sign-up/google',
  {
    idToken  : action.idToken,
    userType : action.userType
  }
)

apis[Types.SIGN_IN_FACEBOOK] = async action => callApi(
  'POST',
  '/auth/sign-in/facebook',
  { accessToken: action.accessToken }
)

apis[Types.SIGN_UP_FACEBOOK] = async action => callApi(
  'POST',
  '/auth/sign-up/facebook',
  {
    accessToken : action.accessToken,
    userType    : action.userType
  }
)

apis[Types.VERIFY_EMAIL] = async action => callApi(
  'POST',
  '/auth/verify-email',
  { token: action.token }
)

export default apis
