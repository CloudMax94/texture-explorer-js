import { each } from 'lodash'
import MenuItem from './menu-item'

class Menu {
  constructor () {
    this.items = []
  }
  append (item) {
    this.items.push(item)
  }
  popup (browserWindow, x, y) {
    var contextmenus = document.querySelectorAll('context-menu')
    each(contextmenus, function (element) {
      element.parentNode.removeChild(element)
    })
    var contextmenu = document.createElement('context-menu')
    contextmenu.style.top = y + 'px'
    contextmenu.style.left = x + 'px'
    // contextmenu.appendChild(this.e)
    document.body.appendChild(contextmenu)
  }
}
Menu.setApplicationMenu = function (menu) {
  // NOTE: This shim does not support setApplicationMenu!
  //       Add the menu directly to the interface store instead
}
var buildFromTemplateSubmenus = function (item) {
  if (item.submenu) {
    var submenu = new Menu()
    each(item.submenu, function (i) {
      i = buildFromTemplateSubmenus(i)
      var subitem = new MenuItem(i)
      submenu.append(subitem)
    })
    item.submenu = submenu
  }
  return item
}
Menu.buildFromTemplate = function (template) {
  var menu = new Menu()
  each(template, function (i) {
    i = buildFromTemplateSubmenus(i)
    var item = new MenuItem(i)

    menu.append(item)
  })
  return menu
}

export default Menu
