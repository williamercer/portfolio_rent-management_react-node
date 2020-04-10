import React from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Chip
} from '@material-ui/core'
import DoneIcon from '@material-ui/icons/Done'
import classnames from 'classnames'
import { AUTH_TYPE } from '../../constants'

const UserCard = ({ style, data, self, openEditUser, openDeleteUser }) => (
  <div style={style}>
    <Card className={classnames('user-card', { edited: data.edited, self })}>
      <CardContent>
        { data.email } &nbsp;
        { data.authType === AUTH_TYPE.GOOGLE && (
          <Chip
            size="small"
            label="google"
            color="secondary"
          />
        )}
        { data.authType === AUTH_TYPE.FACEBOOK && (
          <Chip
            size="small"
            label="facebook"
            color="primary"
          />
        )}
        &nbsp;
        <Chip
          variant="outlined"
          size="small"
          label={data.userType}
          color="primary"
          icon={(data.authType === AUTH_TYPE.EMAIL && data.emailVerified)
            ? <DoneIcon />
            : null}
        /> &nbsp;
        <span className="created-at">
          created at <i>{ new Date(data.createdAt).toLocaleString() }</i>
        </span>
      </CardContent>
      <CardActions>
        <Button onClick={() => openEditUser(true, data._id)} size="small" color="primary">
          Edit
        </Button>
        { !self && (
          <Button
            className="delete-user-button"
            onClick={openDeleteUser}
            size="small"
            color="primary"
          >
            Delete
          </Button>
        )}
      </CardActions>
    </Card>
  </div>
)
UserCard.propTypes = {
  style          : PropTypes.object.isRequired,
  data           : PropTypes.object.isRequired,
  self           : PropTypes.bool.isRequired,
  openEditUser   : PropTypes.func.isRequired,
  openDeleteUser : PropTypes.func.isRequired,
}
export default UserCard
