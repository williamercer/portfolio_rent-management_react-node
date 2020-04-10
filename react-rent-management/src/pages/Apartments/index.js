import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import PropTypes from 'prop-types'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import {
  Button,
  TextField,
  Grid,
  MenuItem
} from '@material-ui/core'
import { FixedSizeList } from 'react-window'
import ApartmentCard from './ApartmentCard'
import Header from '../../components/Header'
import LoadingSpinner from '../../components/LoadingSpinner'
import AlertDialog from '../../components/AlertDialog'
import { Creators, Types } from '../../redux/actions/apartment'
import { Creators as globalCreators } from '../../redux/actions/global'
import { goToDefaultPage } from '../../functions'
import { ACTION_STATUS, USER_TYPE, APARTMENT_STATE } from '../../constants'
import config from '../../config'
import './styles.scss'

const STATE_ALL = 'all'

class View extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isOpenDelete : false,
      selectedId   : null,
      state        : STATE_ALL,
      minSize      : '',
      maxSize      : '',
      minPrice     : '',
      maxPrice     : '',
      minRooms     : '',
      maxRooms     : '',
      width        : 0,
      height       : 0,
      mapCenter    : { lat: 36, lng: -120 },
      mapLoaded    : false
    }
  }

  componentDidMount = () => {
    const { auth, changeLocation } = this.props
    if (!auth.user) {
      goToDefaultPage(auth.user, changeLocation)
      return
    }
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions)
    this.search()
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
    this.setState({ width: window.innerWidth, height: window.innerHeight })
  }

  onChangeValue = fieldName => (event) => {
    this.setState({ [fieldName]: event.target.value })
  }

  onClickItem = (data) => {
    this.setState({ mapCenter: { lat: data.latitude, lng: data.longitude } })
  }

  deleteApartment = () => {
    const { deleteApartment } = this.props
    const { selectedId } = this.state
    this.setState({ isOpenDelete: false })
    deleteApartment(selectedId)
  }

  search = () => {
    const { auth, listApartments } = this.props
    const {
      state,
      minSize,
      maxSize,
      minPrice,
      maxPrice,
      minRooms,
      maxRooms
    } = this.state
    const queryParams = {}
    if (state !== STATE_ALL && auth.user.userType !== USER_TYPE.CLIENT) {
      queryParams.state = state
    }
    if (minSize)  queryParams.minSize = minSize
    if (maxSize)  queryParams.maxSize = maxSize
    if (minPrice) queryParams.minPrice = minPrice
    if (maxPrice) queryParams.maxPrice = maxPrice
    if (minRooms) queryParams.minRooms = minRooms
    if (maxRooms) queryParams.maxRooms = maxRooms
    listApartments(queryParams)
  }

  renderControlBar() {
    const { auth, openEditApartment } = this.props
    const {
      state,
      minSize,
      maxSize,
      minPrice,
      maxPrice,
      minRooms,
      maxRooms
    } = this.state
    return (
      <div className="control-bar">
        <p> Floor area size </p>
        <div className="option-div">
          <TextField
            value={minSize}
            onChange={this.onChangeValue('minSize')}
            type="number"
            variant="outlined"
            size="small"
            placeholder="min"
          />
          &nbsp;<span> - </span>&nbsp;
          <TextField
            value={maxSize}
            onChange={this.onChangeValue('maxSize')}
            type="number"
            variant="outlined"
            size="small"
            placeholder="max"
          />
        </div>
        <p> Price per month </p>
        <div className="option-div">
          <TextField
            value={minPrice}
            onChange={this.onChangeValue('minPrice')}
            type="number"
            variant="outlined"
            size="small"
            placeholder="min"
          />
          &nbsp;<span> - </span>&nbsp;
          <TextField
            value={maxPrice}
            onChange={this.onChangeValue('maxPrice')}
            type="number"
            variant="outlined"
            size="small"
            placeholder="max"
          />
        </div>
        <p> Number of the rooms </p>
        <div className="option-div">
          <TextField
            value={minRooms}
            onChange={this.onChangeValue('minRooms')}
            type="number"
            variant="outlined"
            size="small"
            placeholder="min"
          />
          &nbsp;<span> - </span>&nbsp;
          <TextField
            value={maxRooms}
            onChange={this.onChangeValue('maxRooms')}
            type="number"
            variant="outlined"
            size="small"
            placeholder="max"
          />
        </div>
        <br />
        { auth.user.userType !== USER_TYPE.CLIENT && (
          <TextField
            select
            label="State"
            value={state}
            onChange={this.onChangeValue('state')}
          >
            <MenuItem key={STATE_ALL} value={STATE_ALL}>
              {STATE_ALL}
            </MenuItem>
            { Object.keys(APARTMENT_STATE).map(stateKey => (
              <MenuItem key={stateKey} value={APARTMENT_STATE[stateKey]}>
                {APARTMENT_STATE[stateKey]}
              </MenuItem>
            ))}
          </TextField>
        )}
        <br /> <br />
        <Button
          className="search-button"
          variant="contained"
          color="primary"
          onClick={this.search}
        >
          Search
        </Button>
        <br /> <br />
        { auth.user.userType !== USER_TYPE.CLIENT && (
          <Button
            className="new-button"
            variant="contained"
            color="primary"
            onClick={() => openEditApartment(true, null)}
          >
            New apartment
          </Button>
        )}
      </div>
    )
  }

  render() {
    const { global: { status }, auth, apartment, openEditApartment, loadMore } = this.props
    const { isOpenDelete, width, height, mapCenter, mapLoaded } = this.state
    if (!auth.user) return null

    const loadingTypes = [
      Types.LIST_APARTMENTS,
      Types.DELETE_APARTMENT,
      Types.LOAD_MORE,
    ]
    return (
      <div className="apartments-page">
        <Header />
        <Grid container>
          <Grid className="page-column" item xs={2}>
            { this.renderControlBar() }
          </Grid>
          <Grid className="page-column" item xs={6}>
            <p className="total-counts"> { apartment.totalCounts } found </p>
            <FixedSizeList
              height={height - 90 - 30 - 50 - 36}
              width={width / 2 - 30}
              itemCount={apartment.apartments.length}
              itemSize={auth.user.userType === USER_TYPE.CLIENT ? 240 : 286}
            >
              { ({ index, style }) => (
                <ApartmentCard
                  style={style}
                  data={apartment.apartments[index]}
                  userType={auth.user.userType}
                  openEditApartment={openEditApartment}
                  openDeleteApartment={() => this.setState({ isOpenDelete: true, selectedId: apartment.apartments[index]._id })}
                  onClickItem={() => this.onClickItem(apartment.apartments[index])}
                />
              )}
            </FixedSizeList>
            <br />
            { apartment.before && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => loadMore()}
              >
                Load More ({apartment.loadMore})
              </Button>
            )}
          </Grid>
          <Grid className="page-column" item xs={4}>
            { mapLoaded && <div className="map-flag-div" /> }
            <LoadScript googleMapsApiKey={config.googleMapsApiKey}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '600px' }}
                center={mapCenter}
                zoom={3}
                onLoad={() => this.setState({ mapLoaded: true })}
              >
                {apartment.apartments.map(data => (
                  <Marker
                    key={data._id}
                    position={{ lat: data.latitude, lng: data.longitude }}
                    label={data.name}
                    title={data.description}
                  />
                ))}
              </GoogleMap>
            </LoadScript>
          </Grid>
        </Grid>

        <AlertDialog
          open={isOpenDelete}
          handleCancel={() => this.setState({ isOpenDelete: false })}
          handleOk={this.deleteApartment}
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
  global            : PropTypes.object.isRequired,
  auth              : PropTypes.object.isRequired,
  apartment         : PropTypes.object.isRequired,
  listApartments    : PropTypes.func.isRequired,
  loadMore          : PropTypes.func.isRequired,
  deleteApartment   : PropTypes.func.isRequired,
  openEditApartment : PropTypes.func.isRequired,
  changeLocation    : PropTypes.func.isRequired,
}

const mapStateToProps = store => ({
  auth      : store.auth,
  apartment : store.apartment,
  global    : store.global,
})
const mapDispatchToProps = {
  ...Creators,
  ...globalCreators,
  changeLocation: push,
}

export default connect(mapStateToProps, mapDispatchToProps)(View)
