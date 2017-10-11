import { basename } from 'path'
import { exists, readFile, writeFile } from 'fs'
import { saveAs } from 'file-saver'
import { remote } from 'electron'
const { dialog } = remote

// We handle File & path
export function openFile (input, callback) {
  if (input instanceof File) {
    let file = input
    const reader = new FileReader()
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
