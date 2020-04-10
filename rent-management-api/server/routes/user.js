const router     = require('express').Router()
const controller = require('../controllers/user')

router.use((req, res, next) => {
  if (req.user) {
    next()
  } else {
    res.status(401).json({ err: 'Authorization error' })
  }
})

router.post('/', controller.createUser)

router.get('/self', controller.getSelf)

router.delete('/self', controller.deleteSelf)

router.put('/self/password', controller.changePassword)

router.get('/list', controller.listUsers)

router.delete('/:userId', controller.deleteUser)

router.patch('/:userId', controller.editUser)

module.exports = router
