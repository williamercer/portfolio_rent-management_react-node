import { put, call, takeLatest, all } from 'redux-saga/effects'
import { NotificationManager } from 'react-notifications'
import { Types } from '../actions/auth'

import { requestCreator, successCreator, failureCreator } from '../utils/action'
import API from '../api/auth'

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

function* signUpEmail(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))

    NotificationManager.success('Account has been successfully created!')
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

function* signInFacebook(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
  window.FB.logout()
}

function* signUpFacebook(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
  window.FB.logout()
}

function* checkToken(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))
  } catch (err) {
    yield put(failureCreator(type, { err, showAlert: false }))
  }
}

export function* authSaga() {
  yield all([
    takeLatest(Types.SIGN_IN_EMAIL,    sagaAction),
    takeLatest(Types.SIGN_UP_EMAIL,    signUpEmail),
    takeLatest(Types.SIGN_IN_GOOGLE,   sagaAction),
    takeLatest(Types.SIGN_UP_GOOGLE,   sagaAction),
    takeLatest(Types.SIGN_IN_FACEBOOK, signInFacebook),
    takeLatest(Types.SIGN_UP_FACEBOOK, signUpFacebook),
    takeLatest(Types.CHECK_TOKEN,      checkToken),
    takeLatest(Types.VERIFY_EMAIL,     sagaAction),
  ])
}
