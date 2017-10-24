/* global __APP_VERSION__, __APP_NAME__ */

export function getPath (name) {
  return '/' + __APP_NAME__ + '/' + name
}

export function getVersion () {
  return __APP_VERSION__
}

export function getName () {
  return __APP_NAME__
}

export default {
  getPath,
  getVersion,
  getName
}
