import { parse as parseUrl } from 'url'
import { each } from 'lodash'
import BrowserWindow from './remote/browser-window'
import dialog from './remote/dialog'
import Menu from './remote/menu'
import MenuItem from './remote/menu-item'

export const remote = {
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

export default {
  remote
}
