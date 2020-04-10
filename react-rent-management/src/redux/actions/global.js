import { createActions } from 'reduxsauce'

const { Types, Creators } = createActions({
  updateState       : ['payload'],
  openEditApartment : ['open', 'apartmentId'],
  openEditUser      : ['open', 'userId'],
}, { prefix: 'global_' })

export { Types, Creators }
