import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Button, Paper, TextField } from '@material-ui/core'
import GoogleLogin from 'react-google-login'
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Creators, Types } from '../../redux/actions/auth'
import { goToDefaultPage, validateEmail } from '../../functions'
import { ACTION_STATUS } from '../../constants'
import config from '../../config'
import './styles.scss'

class View extends Component {
  constructor(props) {
    super(props)
    this.state = {
      email    : '',
      password : ''
    }
  }

  componentDidMount = () => {
    const { auth, changeLocation } = this.props
    if (auth.user) {
      goToDefaultPage(auth.user, changeLocation)
    }
  }

  componentDidUpdate = (prevProps) => {
    const { auth: prevAuth } = prevProps
    const { auth, changeLocation } = this.props
    if (!prevAuth.user && auth.user) {
      goToDefaultPage(auth.user, changeLocation)
    }
  }

  onSignInEmail = () => {
    const { signInEmail } = this.props
    const { email, password } = this.state
    signInEmail(email, password)
  }

  onChangeValue = fieldName => (event) => {
    this.setState({ [fieldName]: event.target.value })
  }

  onSuccessGoogle = (data) => {
    const { signInGoogle } = this.props
    signInGoogle(data.tokenObj.id_token)
  }

  onResponseFacebook = (data) => {
    if (data.accessToken) {
      console.log('facebook', data)
      const { signInFacebook } = this.props
      signInFacebook(data.accessToken)
    }
  }

  renderContent() {
    const { email, password } = this.state
    return (
      <>
        <div className="content-div">
          <Paper className="paper-div signin-form">
            <h3> Sign In </h3>
            <TextField
              value={email}
              onChange={this.onChangeValue('email')}
              label="Email"
              name="email"
              margin="normal"
              fullWidth
              required
            />
            <br />
            <TextField
              value={password}
              onChange={this.onChangeValue('password')}
              label="Password"
              type="password"
              name="password"
              margin="normal"
              fullWidth
              required
            />
            <br />
            <div className="button-div">
              <Button
                onClick={this.onSignInEmail}
                disabled={!(email && validateEmail(email) && password)}
                variant="contained"
                color="primary"
                className="right-button"
              >
                Sign In
              </Button>
            </div>
            <div className="separator-div">
              <div> </div>
              <p> or </p>
              <div> </div>
            </div>
            <div className="social-div">
              <GoogleLogin
                clientId={config.googleClientId}
                render={renderProps => (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={renderProps.onClick}
                    disabled={renderProps.disabled}
                  >
                    Sign In with Google
                  </Button>
                )}
                onSuccess={this.onSuccessGoogle}
                onFailure={e => console.log(e)}
                cookiePolicy="single_host_origin"
              />
              &nbsp;&nbsp;
              <FacebookLogin
                appId={config.facebookAppId}
                fields="email"
                render={renderProps => (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={renderProps.onClick}
                    disabled={renderProps.isDisabled}
                  >
                    Sign In with Facebook
                  </Button>
                )}
                callback={this.onResponseFacebook}
              />
            </div>
          </Paper>
        </div>
        <div className="signUp-link">
          <Link to="/sign-up"> Click here to create a new account </Link>
        </div>
      </>
    )
  }

  render() {
    const { global: { status } } = this.props
    const loadingTypes = [
      Types.SIGN_IN_EMAIL,
      Types.SIGN_IN_GOOGLE,
      Types.SIGN_IN_FACEBOOK,
    ]
    return (
      <div className="signIn-page">
        { this.renderContent() }
        { loadingTypes.map(t => status[t]).includes(ACTION_STATUS.REQUEST)
          && <LoadingSpinner /> }
      </div>
    )
  }
}

View.propTypes = {
  global         : PropTypes.object.isRequired,
  auth           : PropTypes.object.isRequired,
  changeLocation : PropTypes.func.isRequired,
  signInEmail    : PropTypes.func.isRequired,
  signInGoogle   : PropTypes.func.isRequired,
  signInFacebook : PropTypes.func.isRequired,
}

const mapStateToProps = store => ({
  auth   : store.auth,
  global : store.global,
})
const mapDispatchToProps = {
  ...Creators,
  changeLocation: push,
}

export default connect(mapStateToProps, mapDispatchToProps)(View)
