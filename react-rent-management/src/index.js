/* eslint no-underscore-dangle: "off" */

import React from 'react'
import { render } from 'react-dom'
import configureStore, { history } from './redux/configureStore'
import sagas from './redux/sagas'
import App from './App'

// Initialize store
const store = configureStore()
sagas.forEach(saga => store.runSaga(saga))

render(
  <App store={store} history={history} />,
  document.getElementById('root')
)
