const Joi       = require('@hapi/joi')
const jsonSpec  = require('json-spec')
const Apartment = require('../models/apartment')
const utils     = require('../utils')
const config    = require('../config')
const {
  USER_TYPE,
  APARTMENT_SPEC,
  APARTMENT_STATE
} = require('../constants')

const controller = {}

controller.createApartment = async (req, res) => {
  // req.user should be admin or realtor
  if (![USER_TYPE.ADMIN, USER_TYPE.REALTOR].includes(req.user.userType)) {
    res.status(403).json({ err: 'No permission' })
    return
  }

  // Get location coordinates from address string
  if (req.body.address) {
    try {
      const location = await utils.getLocationFromAddress(req.body.address)
      Object.assign(req.body, location)
    } catch (err) {
      console.log(err)
      return res.status(400).json({ err: 'Invalid address' })
    }
  }

  const schema = Joi.object({
    name        : Joi.string().required(),
    description : Joi.string().required(),
    size        : Joi.number().positive().required(),
    price       : Joi.number().positive().required(),
    rooms       : Joi.number().integer().positive().required(),
    latitude    : Joi.number().max(90).min(-90).required(),
    longitude   : Joi.number().max(180).min(-180).required(),
    address     : Joi.string().optional(),
    state       : Joi.string().valid(...Object.values(APARTMENT_STATE)).required()
  })
  const { error, value } = schema.validate(req.body)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }

  try {
    // Create a new apartment
    const newApartment = await Apartment.createApartment(req.user._id, value)

    // Return
    const apartmentData = jsonSpec(
      { ...newApartment.toJSON(), realtor: req.user },
      APARTMENT_SPEC
    )
    res.json({ apartment: apartmentData })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.listApartments = async (req, res) => {
  const schema = Joi.object({
    state    : Joi.string().valid(...Object.values(APARTMENT_STATE)).optional(),
    minSize  : Joi.number().min(0).optional(),
    maxSize  : Joi.number().positive().optional(),
    minPrice : Joi.number().min(0).optional(),
    maxPrice : Joi.number().positive().optional(),
    minRooms : Joi.number().min(0).integer().optional(),
    maxRooms : Joi.number().positive().integer().optional(),
    before   : Joi.date().optional(),
    pageSize : Joi.number()
      .integer()
      .positive()
      .max(config.maxPageSize)
      .optional(),
  })
  const { error, value } = schema.validate(req.query)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }
  if (typeof value.minSize === 'number' && typeof value.maxSize === 'number'
    && value.minSize > value.maxSize) {
    return res.status(400).json({ err: 'minSize must be smaller than or equal to maxSize' })
  }
  if (typeof value.minPrice === 'number' && typeof value.maxPrice === 'number'
    && value.minPrice > value.maxPrice) {
    return res.status(400).json({ err: 'minPrice must be smaller than or equal to maxPrice' })
  }
  if (typeof value.minRooms === 'number' && typeof value.maxRooms === 'number'
    && value.minRooms > value.maxRooms) {
    return res.status(400).json({ err: 'minRooms must be smaller than or equal to maxRooms' })
  }

  try {
    const dbQuery = {}
    // Return only associated apartments for the realtor
    if (req.user.userType === USER_TYPE.REALTOR) {
      dbQuery.realtor = req.user._id
    }
    // Return only rentable apartments for the client
    if (req.user.userType === USER_TYPE.CLIENT) {
      dbQuery.state = APARTMENT_STATE.RENTABLE
    } else if (value.state) {
      dbQuery.state = value.state
    }
    // Size filtering
    if (value.minSize || value.maxSize) {
      dbQuery.size = Object.assign(
        value.minSize ? { $gte: value.minSize } : {},
        value.maxSize ? { $lte: value.maxSize } : {}
      )
    }
    // Price filtering
    if (value.minPrice || value.maxPrice) {
      dbQuery.price = Object.assign(
        value.minPrice ? { $gte: value.minPrice } : {},
        value.maxPrice ? { $lte: value.maxPrice } : {}
      )
    }
    // Rooms filtering
    if (value.minRooms || value.maxRooms) {
      dbQuery.rooms = Object.assign(
        value.minRooms ? { $gte: value.minRooms } : {},
        value.maxRooms ? { $lte: value.maxRooms } : {}
      )
    }
    // Pagination
    if (value.before) {
      dbQuery.createdAt = { $lt: value.before }
    }

    // Get apartments
    const totalCounts = await Apartment.countApartments(dbQuery)
    const apartments = await Apartment.listApartments(
      dbQuery, value.pageSize || config.defaultPageSize
    )

    // Return
    res.json({
      totalCounts,
      apartments: jsonSpec(apartments, [APARTMENT_SPEC]),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.getApartment = async (req, res) => {
  try {
    // Get apartment by id
    const apartment = await Apartment.getApartmentById(req.params.apartmentId)
    if (!apartment) {
      res.status(404).json({ err: 'Cannot find apartment' })
      return
    }
    // Realtor cannot get other's apartments
    if (req.user.userType === USER_TYPE.REALTOR
      && apartment.realtor.toString() !== req.user._id) {
      res.status(403).json({ err: 'No permission' })
      return
    }

    // Return
    res.json({ apartment: jsonSpec(apartment, APARTMENT_SPEC) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.deleteApartment = async (req, res) => {
  try {
    // Get apartment by id
    const apartment = await Apartment.getApartmentById(req.params.apartmentId)
    if (!apartment) {
      res.status(404).json({ err: 'Cannot find apartment' })
      return
    }

    // check permission
    const hasPermission = req.user.userType === USER_TYPE.ADMIN
      || (req.user.userType === USER_TYPE.REALTOR && apartment.realtor.toString() === req.user._id)
    if (!hasPermission) {
      res.status(403).json({ err: 'No permission' })
      return
    }

    // Delete
    await apartment.remove()

    // Return
    res.json({ apartmentId: req.params.apartmentId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

controller.editApartment = async (req, res) => {
  // Get location coordinates from address string
  if (req.body.address) {
    try {
      const location = await utils.getLocationFromAddress(req.body.address)
      Object.assign(req.body, location)
    } catch (err) {
      console.log(err)
      return res.status(400).json({ err: 'Invalid address' })
    }
  }

  const schema = Joi.object({
    name        : Joi.string().optional(),
    description : Joi.string().optional(),
    size        : Joi.number().positive().optional(),
    price       : Joi.number().positive().optional(),
    rooms       : Joi.number().integer().positive().optional(),
    latitude    : Joi.number().max(90).min(-90).optional(),
    longitude   : Joi.number().max(180).min(-180).optional(),
    address     : Joi.string().optional(),
    state       : Joi.string().valid(...Object.values(APARTMENT_STATE)).optional()
  })
  const { error, value } = schema.validate(req.body)
  if (error) {
    const err = error.details.length > 0 ? error.details[0].message : 'Invalid request'
    return res.status(400).json({ err })
  }

  try {
    // Get apartment object
    const apartmentObj = await Apartment.getApartmentById(req.params.apartmentId)
    if (!apartmentObj) {
      res.status(404).json({ err: 'Cannot find apartment' })
      return
    }
    // check permission
    const hasPermission = req.user.userType === USER_TYPE.ADMIN
      || (req.user.userType === USER_TYPE.REALTOR && apartmentObj.realtor.toString() === req.user._id)
    if (!hasPermission) {
      res.status(403).json({ err: 'No permission' })
      return
    }

    // Update apartment object
    const fields = Object.keys(value)
    fields.forEach((field) => {
      apartmentObj[field] = value[field]
    })
    if (!value.address
      && (fields.includes('latitude') || fields.includes('longitude'))) {
      apartmentObj.address = null
    }
    await apartmentObj.save()

    // Return
    res.json({
      apartmentId : apartmentObj._id,
      updated     : value
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ err: 'Server error' })
  }
}

module.exports = controller
