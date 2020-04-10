import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch
} from '@material-ui/core'
import { Creators } from '../../redux/actions/user'
import { Creators as globalCreators } from '../../redux/actions/global'
import { validateEmail } from '../../functions'
import { USER_TYPE, AUTH_TYPE } from '../../constants'
import './styles.scss'

const initialState = {
  facebookId    : '',
  googleId      : '',
  email         : '',
  emailVerified : true,
  password      : '',
  needPassword  : true,
  userType      : USER_TYPE.CLIENT,
  authType      : AUTH_TYPE.EMAIL,
}
class View extends Component {
  constructor(props) {
    super(props)
    this.state = { ...initialState }
  }

  componentDidUpdate = (prevProps) => {
    const { global: prevGlobal } = prevProps
    const { global, user } = this.props

    if (!prevGlobal.editUser.open && global.editUser.open) {
      // Initialize state
      if (global.editUser.userId) {
        const currentOne = user.users.find(
          one => one._id === global.editUser.userId
        )
        this.setState({
          ...currentOne,
          password     : '',
          needPassword : false,
        })
      } else {
        this.setState({ ...initialState })
      }
    }
  }

  onClickSave = () => {
    const {
      global,
      editUser,
      addUser,
    } = this.props
    const {
      facebookId, googleId, email, emailVerified, password, needPassword, userType, authType
    } = this.state
    let userData
    if (authType === AUTH_TYPE.EMAIL) {
      userData = Object.assign(
        { email, emailVerified, userType },
        needPassword ? { password } : {}
      )
    }
    if (authType === AUTH_TYPE.GOOGLE) {
      userData = { googleId, email, userType }
    }
    if (authType === AUTH_TYPE.FACEBOOK) {
      userData = { facebookId, email, userType }
    }
    if (global.editUser.userId) {
      editUser(global.editUser.userId, userData)
    } else {
      addUser(userData)
    }
  }

  onChangeValue = fieldName => (event) => {
    this.setState({ [fieldName]: event.target.value })
  }

  onChangeSwitch = fieldName => (event) => {
    this.setState({ [fieldName]: event.target.checked })
  }

  render() {
    const { auth, global, openEditUser } = this.props
    const {
      facebookId, googleId, email, emailVerified, password, needPassword, userType, authType
    } = this.state
    const enabled = email && validateEmail(email) && Boolean(
      (authType === AUTH_TYPE.EMAIL && (!needPassword || password))
      || (authType === AUTH_TYPE.GOOGLE && googleId)
      || (authType === AUTH_TYPE.FACEBOOK && facebookId)
    )
    const self = auth.user && auth.user._id === global.editUser.userId
    return (
      <Dialog
        className="user-dialog"
        open={Boolean(global.editUser.open)}
        onClose={() => openEditUser(false, null)}
      >
        <div className="editUser-width" />
        <DialogTitle>
          { global.editUser.userId ? 'Edit' : 'New' }
        </DialogTitle>
        <DialogContent>
          <RadioGroup
            value={userType}
            onChange={this.onChangeValue('userType')}
          >
            <FormControlLabel
              value={USER_TYPE.CLIENT}
              control={<Radio color="primary" />}
              label="Client"
              disabled={self}
            />
            <FormControlLabel
              value={USER_TYPE.REALTOR}
              control={<Radio color="primary" />}
              label="Realtor"
              disabled={self}
            />
            <FormControlLabel
              value={USER_TYPE.ADMIN}
              control={<Radio color="primary" />}
              label="Admin"
            />
          </RadioGroup>
          { authType === AUTH_TYPE.FACEBOOK && (
            <>
              <TextField
                value={facebookId}
                onChange={this.onChangeValue('facebookId')}
                label="Facebook user id"
                margin="normal"
                fullWidth
                required
              /> <br />
            </>
          )}
          { authType === AUTH_TYPE.GOOGLE && (
            <>
              <TextField
                value={googleId}
                onChange={this.onChangeValue('googleId')}
                label="Google user id"
                margin="normal"
                fullWidth
                required
              /> <br />
            </>
          )}
          <TextField
            value={email}
            onChange={this.onChangeValue('email')}
            label="Email"
            name="email"
            margin="normal"
            fullWidth
            required
          /> <br />
          { authType === AUTH_TYPE.EMAIL && (
            <>
              <FormControlLabel
                control={(
                  <Switch
                    checked={emailVerified}
                    onChange={this.onChangeSwitch('emailVerified')}
                    color="primary"
                  />
                )}
                label={emailVerified ? 'Verified email' : 'Not verified email'}
                disabled={self}
              /> <br />
              { global.editUser.userId && (
                <>
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={needPassword}
                        onChange={this.onChangeSwitch('needPassword')}
                        color="primary"
                      />
                    )}
                    label="Change password"
                  /> <br />
                </>
              )}
              { needPassword && (
                <>
                  <TextField
                    value={password}
                    onChange={this.onChangeValue('password')}
                    label="Password"
                    type="password"
                    name="password"
                    margin="normal"
                    fullWidth
                    required
                  /> <br />
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => openEditUser(false, null)} color="primary">
            Cancel
          </Button>
          <Button
            className="user-save-button"
            onClick={this.onClickSave}
            disabled={!enabled}
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

View.propTypes = {
  auth         : PropTypes.object.isRequired,
  user         : PropTypes.object.isRequired,
  global       : PropTypes.object.isRequired,
  editUser     : PropTypes.func.isRequired,
  addUser      : PropTypes.func.isRequired,
  openEditUser : PropTypes.func.isRequired,
}

const mapStateToProps = store => ({
  auth   : store.auth,
  user   : store.user,
  global : store.global,
})
const mapDispatchToProps = {
  ...Creators,
  ...globalCreators,
}

export default connect(mapStateToProps, mapDispatchToProps)(View)
