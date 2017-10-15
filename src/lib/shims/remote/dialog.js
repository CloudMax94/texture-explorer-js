const fileOpener = document.createElement('input')
fileOpener.type = 'file'
fileOpener.id = 'fileOpener'
fileOpener.style.display = 'none'

document.body.insertBefore(fileOpener, document.body.firstChild)

export function showOpenDialog (w, options, callback) {
  if ('filters' in options) {
    let formats = []
    for (let filter of options.filters) {
      for (let extension of filter.extensions) {
        formats.push('.' + extension)
      }
    }
    fileOpener.accept = formats.join(',')
  } else {
    fileOpener.removeAttribute('accept')
  }
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
