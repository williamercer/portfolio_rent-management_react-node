import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

import { Creators, Types } from '../../redux/actions/auth'
import LoadingSpinner from '../../components/LoadingSpinner'
import { ACTION_STATUS } from '../../constants'
import './styles.scss'

class View extends Component {
  constructor(props) {
    super(props)
    this.state = { }
  }

  componentDidMount = () => {
    const { match, verifyEmail } = this.props
    verifyEmail(match.params.token)
  }

  render() {
    const { global: { status } } = this.props
    const loadingTypes = [Types.VERIFY_EMAIL]
    return (
      <div className="verify-page">
        { status[Types.VERIFY_EMAIL] === ACTION_STATUS.REQUEST && (
          <p>
            Verifying your email...
          </p>
        )}
        { status[Types.VERIFY_EMAIL] === ACTION_STATUS.FAILURE && (
          <p>
            Invalid token
          </p>
        )}
        { status[Types.VERIFY_EMAIL] === ACTION_STATUS.SUCCESS && (
          <div>
            <p>
              Your email has been successfully verified!
            </p>
            <Link to="/sign-in"> Go to SignIn page </Link>
          </div>
        )}
        { loadingTypes.map(t => status[t]).includes(ACTION_STATUS.REQUEST)
          && <LoadingSpinner /> }
      </div>
    )
  }
}

View.propTypes = {
  global      : PropTypes.object.isRequired,
  match       : PropTypes.object.isRequired,
  verifyEmail : PropTypes.func.isRequired,
}

const mapStateToProps = store => ({
  global: store.global,
})
const mapDispatchToProps = {
  ...Creators
}

export default connect(mapStateToProps, mapDispatchToProps)(View)
