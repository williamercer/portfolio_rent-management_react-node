import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  Button,
  AppBar,
  Toolbar,
  Typography,
  IconButton
} from '@material-ui/core'
import AccountCircle from '@material-ui/icons/AccountCircle'
import { Creators } from '../../redux/actions/auth'
import { USER_TYPE } from '../../constants'
import './styles.scss'

class View extends Component {
  onSignOut = () => {
    const { signOut } = this.props
    signOut()
  }

  render() {
    const { auth, changeLocation } = this.props
    return (
      <AppBar position="static" className="header">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => changeLocation('/profile')}
          >
            <AccountCircle />
          </IconButton>
          { auth.user.userType === USER_TYPE.ADMIN && (
            <Typography variant="h6" className="link">
              <Link to="/users"> Users </Link>
            </Typography>
          )}
          <Typography variant="h6" className="link space header-apartments">
            <Link to="/apartments"> Apartments </Link>
          </Typography>
          <Button
            className="sign-out-button"
            onClick={this.onSignOut}
            color="inherit"
          >
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>
    )
  }
}

View.propTypes = {
  auth           : PropTypes.object.isRequired,
  signOut        : PropTypes.func.isRequired,
  changeLocation : PropTypes.func.isRequired,
}

const mapStateToProps = store => ({
  auth: store.auth,
})
const mapDispatchToProps = {
  ...Creators,
  changeLocation: push,
}

export default connect(mapStateToProps, mapDispatchToProps)(View)
