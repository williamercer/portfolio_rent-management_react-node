import { createReducer } from 'reduxsauce'
import { Types as apartTypes } from '../actions/apartment'
import { Types as userTypes } from '../actions/user'
import { Types } from '../actions/global'
import { success } from '../utils/action'

// Initial State
const initialState = {
  status        : {},
  editApartment : {},
  editUser      : {}
}

/* Handlers */
const updateState = (state, action) => ({
  ...state,
  ...action.payload,
})

const openEditApartment = (state, action) => ({
  ...state,
  editApartment: {
    open        : action.open,
    apartmentId : action.apartmentId
  }
})

const closeEditApartment = state => ({
  ...state,
  editApartment: {
    open        : false,
    apartmentId : null
  }
})

const openEditUser = (state, action) => ({
  ...state,
  editUser: {
    open   : action.open,
    userId : action.userId
  }
})

const closeEditUser = state => ({
  ...state,
  editUser: {
    open   : false,
    userId : null
  }
})

// map action types to reducer functions
export const handlers = {
  [Types.UPDATE_STATE]                 : updateState,
  [Types.OPEN_EDIT_APARTMENT]          : openEditApartment,
  [Types.OPEN_EDIT_USER]               : openEditUser,
  [success(apartTypes.EDIT_APARTMENT)] : closeEditApartment,
  [success(apartTypes.ADD_APARTMENT)]  : closeEditApartment,
  [success(userTypes.EDIT_USER)]       : closeEditUser,
  [success(userTypes.ADD_USER)]        : closeEditUser,
}

// Export Reducer
export default createReducer(initialState, handlers)
