import React from 'react'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'connected-react-router'
import PropTypes from 'prop-types'
import Core from './pages/Core'

const App = ({ store, history }) => (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Core />
    </ConnectedRouter>
  </Provider>
)

App.propTypes = {
  store   : PropTypes.object.isRequired,
  history : PropTypes.object.isRequired,
}

export default App
