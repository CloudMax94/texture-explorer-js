import xml2js from 'xml2js'
import { extname, basename } from 'path'
import { exists, readFile, writeFile } from 'fs'
import { padStart } from 'lodash'
import { saveAs } from 'file-saver'
import { remote } from 'electron'
const { dialog } = remote

export function loadProfile (profilePath, callback) {
  var profileExt = extname(profilePath)
  readFile(profilePath, function (err, data) {
    if (err) {
      console.error(err)
      callback(null)
    } else {
      if (profileExt === '.json') {
        try {
          var json = JSON.parse(data)
        } catch (e) {
          console.error('There was an error parsing ' + profilePath)
          console.error(e)
          return
        }
        callback(json)
      } else if (profileExt === '.xml') {
        var parser = new xml2js.Parser({
          tagNameProcessors: [function (name) {
            if (name === 'directory') return 'directories'
            else if (name === 'texture') return 'textures'
            return name
          }],
          attrNameProcessors: [],
          mergeAttrs: true,
          explicitArray: false
        })
        parser.parseString(data, function (err, result) {
          if (err) {
            console.error(err)
            return
          }

          const relativeToAbsolute = function (item, parentAddress = '0x0') {
            let address = '0x00000000'
            if ('address' in item) { // Root does not have an address
              item.address = '0x' + padStart((parseInt(item.address, 16) + parseInt(parentAddress, 16)).toString(16), 8, 0).toUpperCase()
              address = item.address
            }
            if ('palette' in item) {
              item.palette = '0x' + padStart((parseInt(item.palette, 16) + parseInt(parentAddress, 16)).toString(16), 8, 0).toUpperCase()
            }
            if (item.textures) {
              if (!Array.isArray(item.textures)) {
                item.textures = [item.textures]
              }
              item.textures.forEach((texture) => {
                relativeToAbsolute(texture, address)
              })
            }
            if (item.directories) {
              if (!Array.isArray(item.directories)) {
                item.directories = [item.directories]
              }
              item.directories.forEach((directory) => {
                relativeToAbsolute(directory, address)
              })
            }
          }
          relativeToAbsolute(result.root)
          callback(result.root)
        })
      }
    }
  })
}

// We handle File & path
export function openFile (input, callback) {
  if (input instanceof File) {
    let file = input
    const reader = new FileReader()
    event.preventDefault()
    reader.onloadend = (e) => {
      callback({
        data: Buffer.from(e.target.result),
        path: file.path || file.name,
        name: file.name
      })
    }
    reader.readAsArrayBuffer(file)
  } else if (typeof input === 'string') {
    let path = input
    exists(path, (exists) => {
      if (exists) {
        readFile(path, (err, data) => {
          if (err) throw err
          if (callback) {
            callback({
              data: data,
              path: path,
              name: basename(path)
            })
          }
        })
      }
    })
  }
}

// Used to save files to the OS
export function saveFileAs (filePath, fileData, callback) {
  dialog.showSaveDialog(remote.getCurrentWindow(), {
    title: 'Save File',
    defaultPath: filePath
  }, (filePath) => {
    if (filePath) {
      if (process.browser) {
        let blob = new Blob([fileData])
        saveAs(blob, filePath)
      } else {
        writeFile(filePath, fileData, {}, (err) => {
          if (err) throw err
          if (callback) {
            callback(err)
          }
        })
      }
    } else {
      let err = new Error('No file name provided')
      callback(err)
    }
  })
}
