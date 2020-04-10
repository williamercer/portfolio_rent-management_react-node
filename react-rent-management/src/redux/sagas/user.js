import { put, call, takeLatest, all, select } from 'redux-saga/effects'
import { NotificationManager } from 'react-notifications'
import { Types } from '../actions/user'
import { Creators as authCreators } from '../actions/auth'

import { requestCreator, successCreator, failureCreator } from '../utils/action'
import API from '../api/user'

function* sagaAction(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

function* deleteSelf(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))
    NotificationManager.success('Account has been successfully deleted!')
    yield put(authCreators.signOut())
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

function* addUser(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))
    NotificationManager.success('New user has been successfully created!')
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

function* editUser(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))
    NotificationManager.success('User has been successfully updated!')
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

function* deleteUser(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))
    NotificationManager.success('User has been successfully deleted!')
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

function* changePassword(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))
    NotificationManager.success('Password has been successfully changed!')
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

function* loadMore(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const user = yield select(state => state.user)
    const payload = yield call(API[type], { before: user.before })
    yield put(successCreator(type, payload))
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

export function* userSaga() {
  yield all([
    takeLatest(Types.CHANGE_PASSWORD, changePassword),
    takeLatest(Types.DELETE_SELF,     deleteSelf),
    takeLatest(Types.LIST_USERS,      sagaAction),
    takeLatest(Types.LOAD_MORE,       loadMore),
    takeLatest(Types.ADD_USER,        addUser),
    takeLatest(Types.EDIT_USER,       editUser),
    takeLatest(Types.DELETE_USER,     deleteUser),
  ])
}
