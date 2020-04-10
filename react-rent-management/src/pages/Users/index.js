import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import PropTypes from 'prop-types'
import { Button } from '@material-ui/core'
import { FixedSizeList } from 'react-window'
import UserCard from './UserCard'
import Header from '../../components/Header'
import LoadingSpinner from '../../components/LoadingSpinner'
import AlertDialog from '../../components/AlertDialog'
import { Creators, Types } from '../../redux/actions/user'
import { Creators as globalCreators } from '../../redux/actions/global'
import { goToDefaultPage } from '../../functions'
import { ACTION_STATUS, USER_TYPE } from '../../constants'
import './styles.scss'

class View extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isOpenDelete : false,
      selectedId   : null,
      height       : 0,
    }
  }

  componentDidMount = () => {
    const { auth, changeLocation, listUsers } = this.props
    if (!auth.user || auth.user.userType !== USER_TYPE.ADMIN) {
      goToDefaultPage(auth.user, changeLocation)
      return
    }
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions)
    listUsers()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions)
  }

  componentDidUpdate = (prevProps) => {
    const { auth: prevAuth } = prevProps
    const { auth, changeLocation } = this.props
    if (prevAuth.user && !auth.user) {
      goToDefaultPage(auth.user, changeLocation)
    }
  }

  updateWindowDimensions = () => {
    this.setState({ height: window.innerHeight })
  }

  onClickDelete = () => {
    const { deleteUser } = this.props
    const { selectedId } = this.state
    this.setState({ isOpenDelete: false })
    deleteUser(selectedId)
  }

  renderContent() {
    const { auth, user, openEditUser, loadMore } = this.props
    const { height } = this.state
    return (
      <div className="users-content">
        <div className="users-header">
          <span className="total-counts"> { user.totalCounts } users </span> &nbsp;&nbsp;
          <Button
            className="new-button"
            variant="contained"
            color="primary"
            onClick={() => openEditUser(true, null)}
          >
            New user
          </Button>
        </div>
        <FixedSizeList
          height={height - 90 - 30 - 50 - 36}
          width={900}
          itemCount={user.users.length}
          itemSize={122}
        >
          { ({ index, style }) => (
            <UserCard
              style={style}
              data={user.users[index]}
              self={user.users[index]._id === auth.user._id}
              openEditUser={openEditUser}
              openDeleteUser={() => this.setState({ isOpenDelete: true, selectedId: user.users[index]._id })}
            />
          )}
        </FixedSizeList>
        <br />
        { user.before && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => loadMore()}
          >
            Load More ({user.loadMore})
          </Button>
        )}
      </div>
    )
  }

  render() {
    const { global: { status }, auth } = this.props
    const { isOpenDelete } = this.state
    if (!auth.user) return null

    const loadingTypes = [Types.LIST_USERS, Types.DELETE_USER, Types.LOAD_MORE]
    return (
      <div className="users-page">
        <Header />
        { this.renderContent() }
        <AlertDialog
          open={isOpenDelete}
          handleCancel={() => this.setState({ isOpenDelete: false })}
          handleOk={this.onClickDelete}
          title="Are you sure?"
          description="It will be removed."
        />
        { loadingTypes.map(t => status[t]).includes(ACTION_STATUS.REQUEST)
          && <LoadingSpinner /> }
      </div>
    )
  }
}

View.propTypes = {
  global         : PropTypes.object.isRequired,
  auth           : PropTypes.object.isRequired,
  user           : PropTypes.object.isRequired,
  listUsers      : PropTypes.func.isRequired,
  loadMore       : PropTypes.func.isRequired,
  deleteUser     : PropTypes.func.isRequired,
  openEditUser   : PropTypes.func.isRequired,
  changeLocation : PropTypes.func.isRequired,
}

const mapStateToProps = store => ({
  auth   : store.auth,
  user   : store.user,
  global : store.global,
})
const mapDispatchToProps = {
  ...Creators,
  ...globalCreators,
  changeLocation: push,
}

export default connect(mapStateToProps, mapDispatchToProps)(View)
