import { createReducer } from 'reduxsauce'
import { Types } from '../actions/apartment'
import { Types as authTypes } from '../actions/auth'
import { success } from '../utils/action'

// Initial State
const initialState = {
  apartments  : [],
  totalCounts : 0,
  before      : null
}

/* Handlers */
const listApartments = (state, action) => {
  const { apartments, totalCounts, queryParams } = action.payload
  const newState = {
    ...state,
    apartments,
    totalCounts,
    queryParams,
    before: totalCounts > apartments.length
      ? apartments[apartments.length - 1].createdAt : null,
    loadMore: totalCounts - apartments.length
  }
  return newState
}

const loadMore = (state, action) => {
  const { apartments, totalCounts } = action.payload
  const newState = {
    ...state,
    before: totalCounts > apartments.length
      ? apartments[apartments.length - 1].createdAt : null,
    loadMore: totalCounts - apartments.length
  }
  newState.apartments = newState.apartments.concat(apartments)
  return newState
}

const addApartment = (state, action) => {
  const newState = { ...state }
  newState.apartments.splice(0, 0, Object.assign(action.payload.apartment, { edited: true }))
  return newState
}

const editApartment = (state, action) => {
  const newState = { ...state }
  const targetApartment = newState.apartments.find(
    one => one._id === action.payload.apartmentId
  )
  Object.assign(targetApartment, action.payload.updated, { edited: true })
  const fields = Object.keys(action.payload.updated)
  if (!action.payload.updated.address
    && (fields.includes('latitude') || fields.includes('longitude'))) {
    targetApartment.address = null
  }
  return newState
}

const deleteApartment = (state, action) => {
  const newState = { ...state }
  const apartmentIndex = newState.apartments.findIndex(
    one => one._id === action.payload.apartmentId
  )
  newState.apartments.splice(apartmentIndex, 1)
  return newState
}

const initialize = () => ({
  ...initialState,
  apartments: [],
})

// map action types to reducer functions
export const handlers = {
  [success(Types.LIST_APARTMENTS)]  : listApartments,
  [success(Types.LOAD_MORE)]        : loadMore,
  [success(Types.ADD_APARTMENT)]    : addApartment,
  [success(Types.EDIT_APARTMENT)]   : editApartment,
  [success(Types.DELETE_APARTMENT)] : deleteApartment,
  [authTypes.SIGN_OUT]              : initialize,
}

// Export Reducer
export default createReducer(initialState, handlers)
