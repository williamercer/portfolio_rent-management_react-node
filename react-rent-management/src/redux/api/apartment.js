import callApi from '../utils/callApi'
import { Types } from '../actions/apartment'

const apis = {}

apis[Types.LIST_APARTMENTS] = async action => callApi(
  'GET',
  '/apartment/list',
  {},
  action.queryParams
)

apis[Types.LOAD_MORE] = async queryParams => callApi(
  'GET',
  '/apartment/list',
  {},
  queryParams
)

apis[Types.GET_APARTMENT] = async action => callApi(
  'GET',
  `/apartment/${action.apartmentId}`
)

apis[Types.ADD_APARTMENT] = async action => callApi(
  'POST',
  '/apartment',
  action.apartmentData
)

apis[Types.EDIT_APARTMENT] = async action => callApi(
  'PATCH',
  `/apartment/${action.apartmentId}`,
  action.apartmentData
)

apis[Types.DELETE_APARTMENT] = async action => callApi(
  'DELETE',
  `/apartment/${action.apartmentId}`
)

export default apis
