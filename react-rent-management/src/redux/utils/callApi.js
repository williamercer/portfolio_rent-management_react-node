import requestPromise from 'request-promise'
import config from '../../config'

const callApi = async (method, path, body = {}, qs = {}) => {
  const headers = { }
  const token = window.localStorage.getItem('token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return requestPromise({
    method,
    uri  : `${config.server}${path}`,
    headers,
    body,
    qs,
    json : true
  })
}

export default callApi
