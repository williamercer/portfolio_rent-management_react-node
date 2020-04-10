import callApi from '../utils/callApi'
import { Types } from '../actions/user'

const apis = {}

apis[Types.CHANGE_PASSWORD] = async action => callApi(
  'PUT',
  '/user/self/password',
  {
    old      : action.old,
    password : action.password,
  }
)

apis[Types.DELETE_SELF] = async () => callApi(
  'DELETE',
  '/user/self'
)

apis[Types.LIST_USERS] = async () => callApi(
  'GET',
  '/user/list'
)

apis[Types.LOAD_MORE] = async queryParams => callApi(
  'GET',
  '/user/list',
  {},
  queryParams
)

apis[Types.ADD_USER] = async action => callApi(
  'POST',
  '/user',
  action.userData
)

apis[Types.EDIT_USER] = async action => callApi(
  'PATCH',
  `/user/${action.userId}`,
  action.userData
)

apis[Types.DELETE_USER] = async action => callApi(
  'DELETE',
  `/user/${action.userId}`
)

export default apis
