import { globalSaga } from './global'
import { authSaga } from './auth'
import { apartmentSaga } from './apartment'
import { userSaga } from './user'

export default [
  authSaga,
  apartmentSaga,
  userSaga,
  globalSaga,
]
