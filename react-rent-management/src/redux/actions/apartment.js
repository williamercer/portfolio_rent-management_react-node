import { createActions } from 'reduxsauce'

const { Types, Creators } = createActions({
  listApartments  : ['queryParams'],
  loadMore        : [],
  getApartment    : ['apartmentId'],
  addApartment    : ['apartmentData'],
  editApartment   : ['apartmentId', 'apartmentData'],
  deleteApartment : ['apartmentId'],
}, { prefix: 'apartment_' })

export { Types, Creators }
