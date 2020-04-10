import { createReducer } from 'reduxsauce'
import { Types } from '../actions/user'
import { Types as authTypes } from '../actions/auth'
import { success, failure } from '../utils/action'

// Initial State
const initialState = {
  users       : [],
  totalCounts : 0,
  before      : null
}

/* Handlers */
const listUsers = (state, action) => {
  const { users, totalCounts } = action.payload
  const newState = {
    ...state,
    users,
    totalCounts,
    before: totalCounts > users.length
      ? users[users.length - 1].createdAt : null,
    loadMore: totalCounts - users.length
  }
  return newState
}

const loadMore = (state, action) => {
  const { users, totalCounts } = action.payload
  const newState = {
    ...state,
    before: totalCounts > users.length
      ? users[users.length - 1].createdAt : null,
    loadMore: totalCounts - users.length
  }
  newState.users = newState.users.concat(users)
  return newState
}

const addUser = (state, action) => {
  const newState = { ...state }
  newState.users.splice(0, 0, Object.assign(action.payload.user, { edited: true }))
  return newState
}

const editUser = (state, action) => {
  const newState = { ...state }
  const targetUser = newState.users.find(
    one => one._id === action.payload.userId
  )
  Object.assign(targetUser, action.payload.updated, { edited: true })
  return newState
}

const deleteUser = (state, action) => {
  const newState = {
    ...state,
    totalCounts: state.totalCounts - 1
  }
  const userIndex = newState.users.findIndex(
    one => one._id === action.payload.userId
  )
  newState.users.splice(userIndex, 1)
  return newState
}

const initialize = () => ({
  ...initialState,
  users: [],
})

// map action types to reducer functions
export const handlers = {
  [success(Types.LIST_USERS)]  : listUsers,
  [failure(Types.LIST_USERS)]  : initialize,
  [success(Types.LOAD_MORE)]   : loadMore,
  [success(Types.ADD_USER)]    : addUser,
  [success(Types.EDIT_USER)]   : editUser,
  [success(Types.DELETE_USER)] : deleteUser,
  [authTypes.SIGN_OUT]         : initialize,
}

// Export Reducer
export default createReducer(initialState, handlers)
