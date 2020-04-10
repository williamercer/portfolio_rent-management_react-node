const mongoose = require('mongoose')
const { APARTMENT_STATE } = require('../constants')

const apartmentSchema = new mongoose.Schema({
  realtor     : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name        : { type: String, required: true },
  description : { type: String, required: true },
  size        : { type: Number, required: true },
  price       : { type: Number, required: true },
  rooms       : { type: Number, required: true },
  latitude    : { type: Number, required: true },
  longitude   : { type: Number, required: true },
  address     : { type: String },
  state       : {
    type     : String,
    enum     : Object.values(APARTMENT_STATE),
    required : true,
  },
  createdAt: { type: Date, default: Date.now }
})
const Apartment = mongoose.model('Apartment', apartmentSchema)

Apartment.createApartment = async (realtorId, data) => {
  const newApartment = await Apartment({
    realtor: realtorId,
    ...data
  }).save()
  return newApartment
}

Apartment.countApartments = dbQuery => Apartment.countDocuments(dbQuery)

Apartment.listApartments = (dbQuery, pageSize) => Apartment
  .find(dbQuery)
  .populate('realtor')
  .sort('-createdAt')
  .limit(pageSize)
  .lean()

Apartment.getApartmentById = apartmentId => Apartment.findById(apartmentId)

Apartment.deleteApartments = realtor => Apartment.deleteMany({ realtor })

module.exports = Apartment
