const server = process.env.REACT_APP_STAGE === 'e2e_test'
  ? 'http://localhost:5009'
  : 'http://localhost:5005'
const config = {
  server,
  googleClientId   : '250849780367-ebcuj0hml9a2626n8nug4i3ldr11ju4e.apps.googleusercontent.com',
  facebookAppId    : '251640152789909',
  googleMapsApiKey : 'AIzaSyBm_6bZGRe9-BeKZWiEaq0po9bPyRPbZro'
}

export default config
