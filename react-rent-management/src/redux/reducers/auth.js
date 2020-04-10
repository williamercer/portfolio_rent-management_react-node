import { createReducer } from 'reduxsauce'
import { Types } from '../actions/auth'
import { success, failure } from '../utils/action'

// Initial State
const initialState = {
  user: null,
}

/* Handlers */
const signIn = (state, action) => {
  window.localStorage.setItem('token', action.payload.token)
  return {
    ...state,
    user: action.payload.user,
  }
}

const signOut = (state) => {
  window.localStorage.removeItem('token')
  return {
    ...state,
    user: null
  }
}

// map action types to reducer functions
export const handlers = {
  [success(Types.CHECK_TOKEN)]      : signIn,
  [failure(Types.CHECK_TOKEN)]      : signOut,
  [success(Types.SIGN_IN_EMAIL)]    : signIn,
  [success(Types.SIGN_IN_GOOGLE)]   : signIn,
  [success(Types.SIGN_UP_GOOGLE)]   : signIn,
  [success(Types.SIGN_IN_FACEBOOK)] : signIn,
  [success(Types.SIGN_UP_FACEBOOK)] : signIn,
  [Types.SIGN_OUT]                  : signOut,
}

// Export Reducer
export default createReducer(initialState, handlers)
