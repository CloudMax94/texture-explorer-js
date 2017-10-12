import getPath from './remote/app'

export function readFile (path, callback) {
  var val = window.localStorage.getItem(path)
  if (val === null) {
    callback(new Error("ENOENT, open '" + path + "'"), null)
  } else {
    callback(null, val)
  }
}

export function writeFile (path, data, callback) {
  try {
    window.localStorage.setItem(path, data)
    if (callback) {
      callback(null)
    }
  } catch (err) {
    if (callback) {
      callback(err)
    } else {
      throw err
    }
  }
}

export function exists (path, callback) {
  callback(window.localStorage.getItem(path) !== null)
}

export function readdirSync (path) {
  let files = []
  for (let key of Object.keys(localStorage)) {
    if (key.indexOf(path) === 0) {
      files.push(key.substr(path.length + 1))
    }
  }
  return files
}

export function readdir (path, callback) {
  callback(null, readdirSync(path))
}

export default {
  readFile,
  writeFile,
  exists
}
