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
  MenuItem
} from '@material-ui/core'
import { Creators as apartmentCreators } from '../../redux/actions/apartment'
import { Creators as globalCreators } from '../../redux/actions/global'
import { APARTMENT_STATE } from '../../constants'
import './styles.scss'

const COORDINATES = 'coordinates'
const ADDRESS = 'address'
const initialState = {
  name        : '',
  description : '',
  size        : '',
  price       : '',
  rooms       : '',
  latitude    : '',
  longitude   : '',
  address     : '',
  state       : APARTMENT_STATE.RENTABLE,
  addressType : COORDINATES,
}
class View extends Component {
  constructor(props) {
    super(props)
    this.state = { ...initialState }
  }

  componentDidUpdate = (prevProps) => {
    const { global: prevGlobal } = prevProps
    const { global, apartment } = this.props

    if (!prevGlobal.editApartment.open && global.editApartment.open) {
      // Initialize state
      if (global.editApartment.apartmentId) {
        const currentOne = apartment.apartments.find(
          one => one._id === global.editApartment.apartmentId
        )
        this.setState({
          ...currentOne,
          address     : currentOne.address || '',
          addressType : currentOne.address ? ADDRESS : COORDINATES
        })
      } else {
        this.setState({ ...initialState })
      }
    }
  }

  onClickSave = () => {
    const {
      global,
      editApartment,
      addApartment,
    } = this.props
    const {
      name, description, size, price, rooms, latitude, longitude, address, state, addressType
    } = this.state
    const apartmentData = {
      name, description, size, price, rooms, state
    }
    if (addressType === ADDRESS) {
      Object.assign(apartmentData, { address })
    } else {
      Object.assign(apartmentData, { latitude, longitude })
    }
    if (global.editApartment.apartmentId) {
      editApartment(global.editApartment.apartmentId, apartmentData)
    } else {
      addApartment(apartmentData)
    }
  }

  onChangeValue = fieldName => (event) => {
    this.setState({ [fieldName]: event.target.value })
  }

  render() {
    const { global, openEditApartment } = this.props
    const {
      name, description, size, price, rooms, latitude, longitude, address, state, addressType
    } = this.state
    const enabled = Boolean(
      name && description
      && Number(size) > 0
      && Number(price) > 0
      && Number(rooms) > 0 && Number.isInteger(Number(rooms))
      && (
        (addressType === COORDINATES
          && latitude && Math.abs(Number(latitude)) <= 90
          && longitude && Math.abs(Number(longitude)) <= 180)
        || (addressType === ADDRESS && address)
      )
    )
    return (
      <Dialog
        className="apartment-dialog"
        open={Boolean(global.editApartment.open)}
        onClose={() => openEditApartment(false, null)}
      >
        <DialogTitle>
          { global.editApartment.apartmentId ? 'Edit' : 'New' }
        </DialogTitle>
        <DialogContent>
          <TextField
            value={name}
            onChange={this.onChangeValue('name')}
            name="name"
            margin="dense"
            label="Name"
            required
            fullWidth
          />
          <TextField
            value={description}
            onChange={this.onChangeValue('description')}
            name="description"
            margin="dense"
            label="Description"
            multiline
            rowsMax={2}
            required
            fullWidth
          />
          <TextField
            value={size}
            onChange={this.onChangeValue('size')}
            name="size"
            margin="dense"
            type="number"
            label="Floor area size"
            required
            fullWidth
            error={Boolean(size && Number(size) <= 0)}
          />
          <TextField
            value={price}
            onChange={this.onChangeValue('price')}
            name="price"
            margin="dense"
            type="number"
            label="Price per month"
            required
            fullWidth
            error={Boolean(price && Number(price) <= 0)}
          />
          <TextField
            value={rooms}
            onChange={this.onChangeValue('rooms')}
            name="rooms"
            margin="dense"
            type="number"
            label="Number of rooms"
            required
            fullWidth
            error={Boolean(rooms && (Number(rooms) <= 0 || !Number.isInteger(Number(rooms))))}
          />
          <TextField
            select
            margin="dense"
            label="State"
            value={state}
            onChange={this.onChangeValue('state')}
          >
            { Object.keys(APARTMENT_STATE).map(stateKey => (
              <MenuItem key={stateKey} value={APARTMENT_STATE[stateKey]}>
                {APARTMENT_STATE[stateKey]}
              </MenuItem>
            ))}
          </TextField> <br />
          <TextField
            select
            value={addressType}
            margin="dense"
            onChange={this.onChangeValue('addressType')}
          >
            <MenuItem key={COORDINATES} value={COORDINATES}> coordinates </MenuItem>
            <MenuItem key={ADDRESS} value={ADDRESS}> address text </MenuItem>
          </TextField>
          { addressType === COORDINATES ? (
            <>
              <TextField
                value={latitude}
                onChange={this.onChangeValue('latitude')}
                name="latitude"
                margin="dense"
                type="number"
                label="Latitude"
                required
                fullWidth
                error={Boolean(latitude && !(Math.abs(Number(latitude)) <= 90))}
              />
              <TextField
                value={longitude}
                onChange={this.onChangeValue('longitude')}
                name="longitude"
                margin="dense"
                type="number"
                label="Longitude"
                required
                fullWidth
                error={Boolean(longitude && !(Math.abs(Number(longitude)) <= 180))}
              />
            </>
          ) : (
            <TextField
              value={address}
              onChange={this.onChangeValue('address')}
              margin="dense"
              label="Apartment address"
              required
              fullWidth
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => openEditApartment(false, null)} color="primary">
            Cancel
          </Button>
          <Button
            className="apartment-save-button"
            onClick={this.onClickSave}
            disabled={!enabled}
            color="primary"
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

View.propTypes = {
  apartment         : PropTypes.object.isRequired,
  global            : PropTypes.object.isRequired,
  editApartment     : PropTypes.func.isRequired,
  addApartment      : PropTypes.func.isRequired,
  openEditApartment : PropTypes.func.isRequired,
}

const mapStateToProps = store => ({
  apartment : store.apartment,
  global    : store.global,
})
const mapDispatchToProps = {
  ...globalCreators,
  ...apartmentCreators
}

export default connect(mapStateToProps, mapDispatchToProps)(View)
