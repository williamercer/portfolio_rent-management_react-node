import { put, call, takeLatest, all, select } from 'redux-saga/effects'
import { NotificationManager } from 'react-notifications'
import { Types } from '../actions/apartment'

import { requestCreator, successCreator, failureCreator } from '../utils/action'
import API from '../api/apartment'

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

function* addApartment(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))
    NotificationManager.success('New apartment has been successfully created!')
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

function* editApartment(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))
    NotificationManager.success('Apartment has been successfully updated!')
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

function* deleteApartment(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    yield put(successCreator(type, payload))
    NotificationManager.success('Apartment has been successfully deleted!')
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

function* listApartments(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const payload = yield call(API[type], action)
    payload.queryParams = action.queryParams
    yield put(successCreator(type, payload))
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

function* loadMore(action) {
  const type = action.type
  try {
    yield put(requestCreator(type, {}))
    const apartment = yield select(state => state.apartment)
    const queryParams = Object.assign(
      apartment.queryParams, { before: apartment.before }
    )
    const payload = yield call(API[type], queryParams)
    yield put(successCreator(type, payload))
  } catch (err) {
    console.error(err)
    yield put(failureCreator(type, { err }))
  }
}

export function* apartmentSaga() {
  yield all([
    takeLatest(Types.LIST_APARTMENTS,   listApartments),
    takeLatest(Types.LOAD_MORE,         loadMore),
    takeLatest(Types.GET_APARTMENT,     sagaAction),
    takeLatest(Types.ADD_APARTMENT,     addApartment),
    takeLatest(Types.EDIT_APARTMENT,    editApartment),
    takeLatest(Types.DELETE_APARTMENT,  deleteApartment),
  ])
}
