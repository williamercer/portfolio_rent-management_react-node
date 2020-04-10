import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { NotificationContainer } from 'react-notifications'

import LoadingSpinner from '../../components/LoadingSpinner'
import EditApartment from '../../components/EditApartment'
import EditUser from '../../components/EditUser'
import routes from './routes'
import { Creators, Types } from '../../redux/actions/auth'
import { Types as apartmentTypes } from '../../redux/actions/apartment'
import { Types as userTypes } from '../../redux/actions/user'
import { ACTION_STATUS } from '../../constants'
import 'react-notifications/lib/notifications.css'
import './styles.scss'

class View extends Component {
  componentDidMount() {
    const { checkToken } = this.props
    checkToken()
  }

  render() {
    const { global: { status } } = this.props
    const loadingTypes = [
      Types.CHECK_TOKEN,
      apartmentTypes.ADD_APARTMENT,
      apartmentTypes.EDIT_APARTMENT,
      userTypes.ADD_USER,
      userTypes.EDIT_USER,
    ]
    return (
      <>
        { [ACTION_STATUS.SUCCESS, ACTION_STATUS.FAILURE].includes(status[Types.CHECK_TOKEN])
          && routes }
        <NotificationContainer />
        <EditApartment />
        <EditUser />
        { loadingTypes.map(t => status[t]).includes(ACTION_STATUS.REQUEST)
          && <LoadingSpinner /> }
      </>
    )
  }
}

View.propTypes = {
  global     : PropTypes.object.isRequired,
  checkToken : PropTypes.func.isRequired,
}

const mapStateToProps = store => ({
  global: store.global
})
const mapDispatchToProps = {
  ...Creators
}

export default connect(mapStateToProps, mapDispatchToProps)(View)
