require('dotenv').config({ path: '.test.env' })

const controller = require('../apartment')
const Apartment  = require('../../models/apartment')
const utils      = require('../../utils')
const {
  USER_TYPE,
  APARTMENT_STATE
} = require('../../constants')

jest.mock('../../utils')

let res
beforeEach(() => {
  res = {}
  res.status = jest.fn(() => res)
  res.json   = jest.fn(() => res)
})

describe('createApartment controller', () => {
  const apartmentData = {
    name        : 'apartment',
    description : 'description',
    size        : 30,
    price       : 20,
    rooms       : 10,
    state       : APARTMENT_STATE.RENTABLE
  }
  beforeEach(() => {
    utils.getLocationFromAddress = jest.fn(async () => ({
      latitude  : 30,
      longitude : 30,
    }))
    // Mock DB
    Apartment.createApartment = jest.fn(async () => ({
      ...apartmentData,
      toJSON: () => apartmentData,
    }))
  })
  test('creates a new apartment', async () => {
    // Request object
    const req = {
      user : { _id: 'user1', userType: USER_TYPE.REALTOR },
      body : {
        ...apartmentData,
        address: 'address1'
      }
    }

    // Call controller
    await controller.createApartment(req, res)
    expect(utils.getLocationFromAddress).toHaveBeenCalledWith('address1')
    expect(Apartment.createApartment).toHaveBeenCalledTimes(1)
    expect(Apartment.createApartment).toHaveBeenCalledWith('user1', expect.objectContaining({
      latitude  : 30,
      longitude : 30,
    }))

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      apartment: expect.any(Object)
    })
  })
  test('returns 403 if a client is going to create a new apartment', async () => {
    // Request object
    const req = {
      user : { _id: 'user1', userType: USER_TYPE.CLIENT },
      body : {
        ...apartmentData,
        address: 'address1'
      }
    }

    // Call controller
    await controller.createApartment(req, res)
    expect(utils.getLocationFromAddress).toHaveBeenCalledTimes(0)
    expect(Apartment.createApartment).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
  test('returns 400 if address string is invalid', async () => {
    utils.getLocationFromAddress = jest.fn(async () => {
      throw new Error('Mocked error')
    })
    // Request object
    const req = {
      user : { _id: 'user1', userType: USER_TYPE.REALTOR },
      body : {
        ...apartmentData,
        address: 'address1'
      }
    }

    // Call controller
    await controller.createApartment(req, res)
    expect(utils.getLocationFromAddress).toHaveBeenCalledWith('address1')
    expect(Apartment.createApartment).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
  test('returns 400 if request body misses some fields', async () => {
    // Request object
    const req = {
      user : { _id: 'user1', userType: USER_TYPE.REALTOR },
      body : {
        ...apartmentData,
      }
    }

    // Call controller
    await controller.createApartment(req, res)
    expect(utils.getLocationFromAddress).toHaveBeenCalledTimes(0)
    expect(Apartment.createApartment).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
})

describe('listApartments controller', () => {
  const totalCounts = 5
  const apartments = [{ _id: 'apart1' }]
  beforeEach(() => {
    // Mock DB
    Apartment.countApartments = jest.fn(async () => totalCounts)
    Apartment.listApartments = jest.fn(async () => apartments)
  })
  test('returns the apartments according to query', async () => {
    // Request object
    const req = {
      user  : { _id: 'user1', userType: USER_TYPE.REALTOR },
      query : { pageSize: 20 }
    }

    // Call controller
    await controller.listApartments(req, res)
    const dbQuery = expect.objectContaining({
      realtor: 'user1'
    })
    expect(Apartment.countApartments).toHaveBeenCalledWith(dbQuery)
    expect(Apartment.listApartments).toHaveBeenCalledWith(dbQuery, 20)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      totalCounts, apartments
    })
  })
  test('returns 400 error if the query is invalid', async () => {
    // Request object
    const req = {
      user  : { _id: 'user1', userType: USER_TYPE.REALTOR },
      query : { minSize: 'awef' }
    }

    // Call controller
    await controller.listApartments(req, res)
    expect(Apartment.countApartments).toHaveBeenCalledTimes(0)
    expect(Apartment.listApartments).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
  test('returns only rentable apartments for the clients', async () => {
    // Request object
    const req = {
      user  : { _id: 'user1', userType: USER_TYPE.CLIENT },
      query : { pageSize: 20 }
    }

    // Call controller
    await controller.listApartments(req, res)
    const dbQuery = expect.objectContaining({
      state: APARTMENT_STATE.RENTABLE
    })
    expect(Apartment.countApartments).toHaveBeenCalledWith(dbQuery)
    expect(Apartment.listApartments).toHaveBeenCalledWith(dbQuery, 20)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      totalCounts, apartments
    })
  })
  test('returns 500 error if db query fails', async () => {
    // Mock DB error
    Apartment.listApartments = jest.fn(async () => {
      throw new Error('mocked error')
    })
    // Request object
    const req = {
      user  : { _id: 'user1', userType: USER_TYPE.REALTOR },
      query : { pageSize: 20 }
    }

    // Call controller
    await controller.listApartments(req, res)
    const dbQuery = expect.objectContaining({
      realtor: 'user1'
    })
    expect(Apartment.countApartments).toHaveBeenCalledWith(dbQuery)
    expect(Apartment.listApartments).toHaveBeenCalledWith(dbQuery, 20)

    // Check response
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
})

describe('getApartment controller', () => {
  beforeEach(() => {
    // Mock DB
    Apartment.getApartmentById = jest.fn(async () => ({ realtor: 'user1' }))
  })
  test('returns the apartment according to request param', async () => {
    // Request object
    const req = {
      user   : { _id: 'user1', userType: USER_TYPE.REALTOR },
      params : { apartmentId: 'apartment1' }
    }

    // Call controller
    await controller.getApartment(req, res)
    expect(Apartment.getApartmentById).toHaveBeenCalledWith('apartment1')

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      apartment: { realtor: 'user1' }
    })
  })
  test("returns 403 error if a realtor tries to get another's apartment", async () => {
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.REALTOR },
      params : { apartmentId: 'apartment1' }
    }

    // Call controller
    await controller.getApartment(req, res)
    expect(Apartment.getApartmentById).toHaveBeenCalledWith('apartment1')

    // Check response
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
  test('returns 404 error if it cannot find the apartment', async () => {
    // Mock DB
    Apartment.getApartmentById = jest.fn(async () => null)
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.REALTOR },
      params : { apartmentId: 'apartment1' }
    }

    // Call controller
    await controller.getApartment(req, res)
    expect(Apartment.getApartmentById).toHaveBeenCalledWith('apartment1')

    // Check response
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
})

describe('deleteApartment controller', () => {
  let apartmentObj
  beforeEach(() => {
    // Mock DB
    apartmentObj = {
      realtor : 'user1',
      remove  : jest.fn(async () => true)
    }
    Apartment.getApartmentById = jest.fn(async () => apartmentObj)
  })
  test('deletes the apartment according to request param', async () => {
    // Request object
    const req = {
      user   : { _id: 'user1', userType: USER_TYPE.REALTOR },
      params : { apartmentId: 'apartment1' }
    }

    // Call controller
    await controller.deleteApartment(req, res)
    expect(Apartment.getApartmentById).toHaveBeenCalledWith('apartment1')
    expect(apartmentObj.remove).toHaveBeenCalledTimes(1)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      apartmentId: 'apartment1'
    })
  })
  test("returns 403 error if a realtor tries to delete another's apartment", async () => {
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.REALTOR },
      params : { apartmentId: 'apartment1' }
    }

    // Call controller
    await controller.deleteApartment(req, res)
    expect(Apartment.getApartmentById).toHaveBeenCalledWith('apartment1')
    expect(apartmentObj.remove).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
  test('returns 404 error if it cannot find the apartment', async () => {
    // Mock DB
    Apartment.getApartmentById = jest.fn(async () => null)
    // Request object
    const req = {
      user   : { _id: 'user2', userType: USER_TYPE.REALTOR },
      params : { apartmentId: 'apartment1' }
    }

    // Call controller
    await controller.deleteApartment(req, res)
    expect(Apartment.getApartmentById).toHaveBeenCalledWith('apartment1')

    // Check response
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
})

describe('editApartment controller', () => {
  let apartmentObj
  beforeEach(() => {
    utils.getLocationFromAddress = jest.fn(async () => ({
      latitude  : 30,
      longitude : 30,
    }))
    // Mock DB
    apartmentObj = {
      _id     : 'apartment1',
      realtor : 'user1',
      save    : jest.fn(async () => true)
    }
    Apartment.getApartmentById = jest.fn(async () => apartmentObj)
  })
  test('updates the apartment according to the request', async () => {
    // Request object
    const req = {
      user   : { _id: 'user1', userType: USER_TYPE.REALTOR },
      params : { apartmentId: 'apartment1' },
      body   : {
        address: 'address1'
      }
    }

    // Call controller
    await controller.editApartment(req, res)
    expect(utils.getLocationFromAddress).toHaveBeenCalledWith('address1')
    expect(Apartment.getApartmentById).toHaveBeenCalledWith('apartment1')
    expect(apartmentObj).toEqual(expect.objectContaining({
      latitude  : 30,
      longitude : 30,
      address   : 'address1',
    }))
    expect(apartmentObj.save).toHaveBeenCalledTimes(1)

    // Check response
    expect(res.status).toHaveBeenCalledTimes(0)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      apartmentId : 'apartment1',
      updated     : expect.any(Object)
    })
  })
  test('returns 400 error if request is invalid', async () => {
    // Request object
    const req = {
      user   : { _id: 'user1', userType: USER_TYPE.REALTOR },
      params : { apartmentId: 'apartment1' },
      body   : {
        invalid: 'invalid'
      }
    }

    // Call controller
    await controller.editApartment(req, res)
    expect(utils.getLocationFromAddress).toHaveBeenCalledTimes(0)
    expect(Apartment.getApartmentById).toHaveBeenCalledTimes(0)
    expect(apartmentObj.save).toHaveBeenCalledTimes(0)

    // Check response
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
  test('returns 404 error if it cannot find the apartment', async () => {
    // Mock DB
    Apartment.getApartmentById = jest.fn(async () => null)
    // Request object
    const req = {
      user   : { _id: 'user1', userType: USER_TYPE.REALTOR },
      params : { apartmentId: 'apartment1' },
      body   : {
        address: 'address1'
      }
    }

    // Call controller
    await controller.editApartment(req, res)
    expect(Apartment.getApartmentById).toHaveBeenCalledWith('apartment1')

    // Check response
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      err: expect.any(String)
    })
  })
})
