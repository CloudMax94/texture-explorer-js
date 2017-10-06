export function readFile (path, callback) {
  var val = window.localStorage.getItem(path)
  if (val === null) {
    callback(new Error("ENOENT, open '" + path + "'"), null)
  } else {
    callback(null, val)
  }
}

export function writeFile (path, data, callback) {
  window.localStorage.setItem(path, data)
  if (callback) {
    callback()
  }
}

export function exists (path, callback) {
  callback(window.localStorage.getItem(path) !== null)
}

export default {
  readFile,
  writeFile,
  exists
}
