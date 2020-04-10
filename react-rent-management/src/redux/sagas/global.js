import { put, select, takeEvery, all } from 'redux-saga/effects'
import { NotificationManager } from 'react-notifications'
import { Creators } from '../actions/global'
import { origin } from '../utils/action'

function* listenAction(action) {
  const { status } = yield select(state => state.global)
  if (action.type.endsWith('/request')) {
    const newStatus = {
      ...status,
      [origin(action.type)]: 'request',
    }
    yield put(Creators.updateState({ status: newStatus }))
  } else if (action.type.endsWith('/success')) {
    const newStatus = {
      ...status,
      [origin(action.type)]: 'success',
    }
    yield put(Creators.updateState({ status: newStatus }))
  } else if (action.type.endsWith('/failure')) {
    const newStatus = {
      ...status,
      [origin(action.type)]: 'failure',
    }
    yield put(Creators.updateState({ status: newStatus }))

    const { err, showAlert } = action.payload
    if (err
      && err.error
      && err.error.err
      && showAlert !== false) {
      NotificationManager.error(err.error.err)
    }
  }
}

export function* globalSaga() {
  yield all([
    takeEvery('*', listenAction),
  ])
}
