import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import PropTypes from 'prop-types'
import { Button, Chip, TextField } from '@material-ui/core'
import Header from '../../components/Header'
import LoadingSpinner from '../../components/LoadingSpinner'
import AlertDialog from '../../components/AlertDialog'
import { goToDefaultPage } from '../../functions'
import { Creators, Types } from '../../redux/actions/user'
import { ACTION_STATUS, AUTH_TYPE } from '../../constants'
import './styles.scss'


class View extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isOpenDelete : false,
      old          : '',
      password     : '',
      confirm      : ''
    }
  }

  componentDidMount = () => {
    const { auth, changeLocation } = this.props
    if (!auth.user) {
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
    if (prevAuth.user && !auth.user) {
      goToDefaultPage(auth.user, changeLocation)
    }
    if (prevStatus[Types.CHANGE_PASSWORD] !== status[Types.CHANGE_PASSWORD]
      && status[Types.CHANGE_PASSWORD] === ACTION_STATUS.SUCCESS) {
      this.setState({
        old      : '',
        password : '',
        confirm  : ''
      })
    }
  }

  onChangeValue = fieldName => (event) => {
    this.setState({ [fieldName]: event.target.value })
  }

  renderChangePassword() {
    const { changePassword } = this.props
    const { old, password, confirm } = this.state
    return (
      <>
        <TextField
          value={old}
          onChange={this.onChangeValue('old')}
          label="Old Password"
          type="password"
          margin="normal"
          fullWidth
          required
        />
        <br />
        <TextField
          value={password}
          onChange={this.onChangeValue('password')}
          label="New Password"
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
        <br /><br />
        <Button
          variant="contained"
          color="primary"
          disabled={!(old && password && password === confirm)}
          onClick={() => changePassword(old, password)}
        >
          Change password
        </Button>
      </>
    )
  }

  render() {
    const { global: { status }, auth, deleteSelf } = this.props
    const { isOpenDelete } = this.state
    if (!auth.user) return null

    const loadingTypes = [
      Types.DELETE_SELF,
      Types.CHANGE_PASSWORD,
    ]
    return (
      <div className="profile-page">
        <Header />
        <div className="content-div">
          <Chip
            variant="outlined"
            size="small"
            label={auth.user.userType}
            color="primary"
          />
          <p>
            { auth.user.email }
          </p>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => this.setState({ isOpenDelete: true })}
          >
            Delete my account
          </Button>
          <br /><br />
          { auth.user.authType === AUTH_TYPE.EMAIL && (
            this.renderChangePassword()
          )}
          { auth.user.authType === AUTH_TYPE.GOOGLE && (
            <Chip
              size="small"
              label={auth.user.authType}
              color="secondary"
            />
          )}
          { auth.user.authType === AUTH_TYPE.FACEBOOK && (
            <Chip
              size="small"
              label={auth.user.authType}
              color="primary"
            />
          )}
        </div>
        { loadingTypes.map(t => status[t]).includes(ACTION_STATUS.REQUEST)
          && <LoadingSpinner /> }
        <AlertDialog
          open={isOpenDelete}
          handleCancel={() => this.setState({ isOpenDelete: false })}
          handleOk={() => deleteSelf()}
          title="Are you sure?"
          description="Your account will be removed."
        />
      </div>
    )
  }
}

View.propTypes = {
  global         : PropTypes.object.isRequired,
  auth           : PropTypes.object.isRequired,
  deleteSelf     : PropTypes.func.isRequired,
  changePassword : PropTypes.func.isRequired,
  changeLocation : PropTypes.func.isRequired,
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
