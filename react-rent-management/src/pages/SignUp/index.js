import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  Button,
  Paper,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@material-ui/core'
import GoogleLogin from 'react-google-login'
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Creators, Types } from '../../redux/actions/auth'
import { goToDefaultPage, validateEmail } from '../../functions'
import { ACTION_STATUS, USER_TYPE } from '../../constants'
import config from '../../config'
import './styles.scss'

class View extends Component {
  constructor(props) {
    super(props)
    this.state = {
      email    : '',
      password : '',
      confirm  : '',
      userType : USER_TYPE.CLIENT,
    }
  }

  componentDidMount = () => {
    const { auth, changeLocation } = this.props
    if (auth.user) {
      goToDefaultPage(auth.user, changeLocation)
    }
  }

  componentDidUpdate = (prevProps) => {
    const {
      auth: prevAuth,
      global: { status : prevStatus }
    } = prevProps
    const {
      auth,
      global: { status },
      changeLocation
    } = this.props
    if (!prevAuth.user && auth.user) {
      goToDefaultPage(auth.user, changeLocation)
    }
    if (prevStatus[Types.SIGN_UP_EMAIL] !== status[Types.SIGN_UP_EMAIL]
      && status[Types.SIGN_UP_EMAIL] === ACTION_STATUS.SUCCESS) {
      this.setState({
        email    : '',
        password : '',
        confirm  : '',
      })
    }
  }

  onSignUpEmail = () => {
    const { signUpEmail } = this.props
    const { email, password, userType } = this.state
    signUpEmail(email, password, userType)
  }

  onChangeValue = fieldName => (event) => {
    this.setState({ [fieldName]: event.target.value })
  }

  onSuccessGoogle = (data) => {
    const { signUpGoogle } = this.props
    const { userType } = this.state
    signUpGoogle(data.tokenObj.id_token, userType)
  }

  onResponseFacebook = (data) => {
    if (data.accessToken) {
      console.log('facebook', data)
      const { signUpFacebook } = this.props
      const { userType } = this.state
      signUpFacebook(data.accessToken, userType)
    }
  }

  renderContent() {
    const { email, password, confirm, userType } = this.state
    return (
      <>
        <div className="content-div">
          <Paper className="paper-div">
            <h3> Sign Up </h3>
            <RadioGroup
              value={userType}
              onChange={this.onChangeValue('userType')}
            >
              <FormControlLabel
                value={USER_TYPE.CLIENT}
                control={<Radio color="primary" />}
                label="Client"
              />
              <FormControlLabel
                value={USER_TYPE.REALTOR}
                control={<Radio color="primary" />}
                label="Realtor"
              />
            </RadioGroup>
            <TextField
              value={email}
              onChange={this.onChangeValue('email')}
              label="Email"
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
              margin="normal"
              fullWidth
              required
            />
            <br />
            <TextField
              value={confirm}
              onChange={this.onChangeValue('confirm')}
              label="Confirm Password"
              type="password"
              error={Boolean(confirm && password !== confirm)}
              margin="normal"
              fullWidth
              required
            />
            <br />
            <div className="button-div">
              <Button
                onClick={this.onSignUpEmail}
                disabled={!(email && validateEmail(email) && password && password === confirm)}
                variant="contained"
                color="primary"
                className="right-button"
              >
                Sign Up
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
                    Sign Up with Google
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
                    Sign Up with Facebook
                  </Button>
                )}
                callback={this.onResponseFacebook}
              />
            </div>
          </Paper>
        </div>
        <div className="signIn-link">
          <Link to="/sign-in"> Already have an account? </Link>
        </div>
      </>
    )
  }

  render() {
    const { global: { status } } = this.props
    const loadingTypes = [
      Types.SIGN_UP_EMAIL,
      Types.SIGN_UP_GOOGLE,
      Types.SIGN_UP_FACEBOOK,
    ]
    return (
      <div className="signUp-page">
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
  signUpEmail    : PropTypes.func.isRequired,
  signUpGoogle   : PropTypes.func.isRequired,
  signUpFacebook : PropTypes.func.isRequired,
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
