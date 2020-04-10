/**
 * Given an object and a schema, this function returns
 * only the keys provided in the schema that are in
 * the object. Useful for fomatting API responses.
 * @param  {Object} subject The object to format
 * @param  {Object} schema The keys to return
 * @return {Object}
 */
const jsonSpec = (subject, schema) => {
  // If this is a mongo object, convert it to a plain JS Object
  if (typeof subject.toObject === 'function') {
    subject = subject.toObject()
  }

  // If subject is an array, recursively iterate through each element
  if (Array.isArray(schema) && Array.isArray(subject)) {
    return subject.map((item) => {
      if (typeof item === 'object') {
        return jsonSpec(item, schema[0])
      }
      return item
    })
  }

  // Pick out the keys in the subject that match the schema
  subject = Object.keys(subject)
    .filter(key => Object.keys(schema).indexOf(key) >= 0)
    .reduce((newObj, key) => Object.assign(newObj, { [key]: subject[key] }), {})

  // Recursively walk through each element in the object
  Object.keys(schema).forEach((key) => {
    if (
      subject[key] !== null && schema[key] !== true && typeof subject[key] === typeof schema[key]
    ) {
      subject[key] = jsonSpec(subject[key], schema[key])
    }
  })
  return subject
}

module.exports = jsonSpec
