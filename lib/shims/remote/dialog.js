var fileOpener = document.createElement('input')
fileOpener.type = 'file'
fileOpener.id = 'fileOpener'
fileOpener.style.display = 'none'

document.body.insertBefore(fileOpener, document.body.firstChild)

export function showOpenDialog (w, options, callback) {
  var fileOpener = document.getElementById('fileOpener')
  fileOpener.onchange = function (event) {
    callback(this.files)
  }
  fileOpener.click()
}

export function showSaveDialog (w, options, callback) {
  var fileName = prompt('File Name', options.defaultPath)
  callback(fileName)
}

export default {
  showOpenDialog,
  showSaveDialog
}
