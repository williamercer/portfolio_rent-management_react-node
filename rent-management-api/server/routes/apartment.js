const router     = require('express').Router()
const controller = require('../controllers/apartment')

router.use((req, res, next) => {
  if (req.user) {
    next()
  } else {
    res.status(401).json({ err: 'Authorization error' })
  }
})

router.post('/', controller.createApartment)

router.get('/list', controller.listApartments)

router.get('/:apartmentId', controller.getApartment)

router.delete('/:apartmentId', controller.deleteApartment)

router.patch('/:apartmentId', controller.editApartment)

module.exports = router
