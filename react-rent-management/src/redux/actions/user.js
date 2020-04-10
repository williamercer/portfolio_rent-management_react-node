import { createActions } from 'reduxsauce'

const { Types, Creators } = createActions({
  changePassword : ['old', 'password'],
  deleteSelf     : [],
  listUsers      : [],
  loadMore       : [],
  addUser        : ['userData'],
  editUser       : ['userId', 'userData'],
  deleteUser     : ['userId'],
}, { prefix: 'user_' })

export { Types, Creators }
