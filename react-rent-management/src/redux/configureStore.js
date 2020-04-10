/* eslint no-underscore-dangle: "off" */

import { createBrowserHistory } from 'history'
import createSagaMiddleware from 'redux-saga'
import { applyMiddleware, compose, createStore } from 'redux'
import { routerMiddleware } from 'connected-react-router'
import createRootReducer from './reducers'

export const history = createBrowserHistory()
const sagaMiddleware = createSagaMiddleware()

export default function configureStore(preloadedState) {
  const composeEnhancer = process.env.REACT_APP_STAGE !== 'prod'
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
    : compose
  const store = createStore(
    createRootReducer(history),
    preloadedState,
    composeEnhancer(
      applyMiddleware(
        routerMiddleware(history),
        sagaMiddleware
      )
    )
  )
  // Extensions
  store.runSaga = sagaMiddleware.run
  return store
}
