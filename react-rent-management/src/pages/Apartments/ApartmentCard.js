import React from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardActionArea,
  CardContent,
  CardActions,
  Button,
  Typography,
  TextField,
  Chip
} from '@material-ui/core'
import classnames from 'classnames'
import { APARTMENT_STATE, USER_TYPE } from '../../constants'

const ApartmentCard = ({ style, data, userType, openEditApartment, openDeleteApartment, onClickItem }) => (
  <div style={style}>
    <Card className={classnames('apartment-card', { edited: data.edited })}>
      <CardActionArea className="apartment-details" onClick={onClickItem}>
        <CardContent>
          <Typography gutterBottom variant="h5" component="h2">
            { data.name } &nbsp;
            <span className="apartment-owner"> <i> { data.realtor.email } </i></span> &nbsp;
            <Chip
              size="small"
              label={data.state}
              color={data.state === APARTMENT_STATE.RENTABLE ? 'primary' : 'secondary'}
            /> &nbsp;
            <span className="created-at">
              created at <i>{ new Date(data.createdAt).toLocaleString() }</i>
            </span>
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            { data.description }
          </Typography>
          <TextField
            value={data.size}
            label="Floor area size"
            margin="dense"
            InputProps={{ readOnly: true }}
          />
          <TextField
            value={data.price}
            label="Price per month"
            margin="dense"
            InputProps={{ readOnly: true }}
          />
          <TextField
            value={data.rooms}
            label="Number of rooms"
            margin="dense"
            InputProps={{ readOnly: true }}
          /> <br />
          <TextField
            value={`${data.address || ''}  (${data.latitude}, ${data.longitude})`}
            label="Location"
            margin="dense"
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </CardContent>
      </CardActionArea>
      { userType !== USER_TYPE.CLIENT && (
        <CardActions>
          <Button onClick={() => openEditApartment(true, data._id)} size="small" color="primary">
            Edit
          </Button>
          <Button
            className="delete-apartment-button"
            onClick={() => openDeleteApartment()}
            size="small"
            color="primary"
          >
            Delete
          </Button>
        </CardActions>
      )}
    </Card>
  </div>
)
ApartmentCard.propTypes = {
  style               : PropTypes.object.isRequired,
  data                : PropTypes.object.isRequired,
  userType            : PropTypes.string.isRequired,
  openEditApartment   : PropTypes.func.isRequired,
  openDeleteApartment : PropTypes.func.isRequired,
  onClickItem         : PropTypes.func.isRequired,
}
export default ApartmentCard
