import { parse as parseUrl } from 'url'
import { each } from 'lodash'
import app from './remote/app'
import BrowserWindow from './remote/browser-window'
import dialog from './remote/dialog'
import Menu from './remote/menu'
import MenuItem from './remote/menu-item'

export const remote = {
  app,
  BrowserWindow,
  dialog,
  Menu,
  MenuItem,
  getGlobal (g) {
    if (g === 'argv') {
      var urlParts = parseUrl(window.location.href, true)
      var query = urlParts.query
      var query_ = []
      each(query, function (val, key) {
        if (val === '') {
          delete query[key]
          query_.push(key)
        }
      })
      query._ = query_
      return query
    }
    return null
  },
  getCurrentWindow () {
    return require('./remote/browser-window').getFocusedWindow()
  }
}

var clipboardElement = document.createElement('textarea')
clipboardElement.id = 'clipboarder'
clipboardElement.hidden = true
document.body.insertBefore(clipboardElement, document.body.firstChild)

export const clipboard = {
  writeText (text) {
    clipboardElement.value = text
    let currentTarget = document.activeElement
    clipboardElement.hidden = false
    clipboardElement.select()
    try {
      var success = document.execCommand('copy')
      if (!success) {
      } else {
      }
    } catch (err) {
    }
    clipboardElement.hidden = true
    if (currentTarget) {
      currentTarget.focus()
    }
  }
}

export default {
  remote,
  clipboard
}
