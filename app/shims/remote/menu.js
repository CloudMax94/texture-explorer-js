import { each } from 'lodash'
import MenuItem from './menu-item'

let contextmenu
let contextmenuBackdrop

function removeContextMenu () {
  if (contextmenu) {
    contextmenu.parentNode.removeChild(contextmenu)
    contextmenu = null
    contextmenuBackdrop.parentNode.removeChild(contextmenuBackdrop)
    contextmenuBackdrop = null
  }
}
window.addEventListener('mousedown', (event) => {
  removeContextMenu()
})
window.addEventListener('resize', (event) => {
  removeContextMenu()
})

class Menu {
  constructor () {
    this.items = []
  }
  append (item) {
    this.items.push(item)
  }
  popup (browserWindow, x, y) {
    removeContextMenu()
    contextmenuBackdrop = document.createElement('div')
    contextmenuBackdrop.classList.add('context-menu-backdrop')

    contextmenu = document.createElement('div')
    contextmenu.classList.add('context-menu')
    for (let item of this.items) {
      let e = document.createElement('div')
      if (item.type === 'separator') {
        e.classList.add('menu-separator')
      } else {
        e.classList.add('menu-item')
        e.innerHTML = item.label
        e.addEventListener('click', (event) => {
          removeContextMenu()
          item.click()
        })
        e.addEventListener('mousedown', (event) => {
          event.preventDefault()
          event.stopPropagation()
        })
      }
      contextmenu.appendChild(e)
    }
    contextmenu.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      event.stopPropagation()
    })
    document.body.appendChild(contextmenuBackdrop)
    document.body.appendChild(contextmenu)

    // Make sure that the context menu is within the page boundary
    const computedStyle = window.getComputedStyle(contextmenu, null)
    const height = Math.ceil(parseFloat(computedStyle.getPropertyValue('height')))
    const windowHeight = window.innerHeight
    if (y + height > windowHeight) {
      y = Math.max(0, y - height)
    }
    const width = Math.ceil(parseFloat(computedStyle.getPropertyValue('width')))
    const windowWidth = window.innerWidth
    if (x + width > windowWidth) {
      x = Math.max(0, x - width)
    }
    contextmenu.style.top = y + 'px'
    contextmenu.style.left = x + 'px'
  }
}
Menu.setApplicationMenu = function (menu) {
  // NOTE: Shim does not support setApplicationMenu, this is just a stub.
  //       In electron this sets the application menu for main window & all popups
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
