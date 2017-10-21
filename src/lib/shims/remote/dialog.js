let prompt
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

export function attachPromptAction (promptAction) {
  prompt = promptAction
}

export function showSaveDialog (w, options, callback) {
  prompt({
    title: 'File Name',
    type: 'text',
    value: options.defaultPath,
    buttons: [
      {
        text: 'Save',
        callback: callback
      },
      {
        text: 'Cancel'
      }
    ]
  }, callback)
}

export default {
  showOpenDialog,
  showSaveDialog,
  attachPromptAction
}
