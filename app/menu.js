import { openFile } from './utils/fileHandler'
import { remote } from 'electron'
import { bindActionCreators } from 'redux'
import {
  toggleAboutDialog,
  resetPanels,
  setApplicationMenu
} from './actions/interface'
import { createDirectory, createTexture } from './actions/profile'
import { createWorkspace, saveFile } from './actions/workspace'
const { Menu, MenuItem, dialog } = remote
const argv = remote.getGlobal('argv')

function initializeMenu (store) {
  const { dispatch, subscribe, getState } = store
  const actions = bindActionCreators({
    resetPanels,
    createWorkspace,
    saveFile,
    createDirectory,
    createTexture,
    setApplicationMenu,
    toggleAboutDialog
  }, dispatch)

  function updateMenu () {
    Menu.setApplicationMenu(menu)
    if (process.browser) {
      actions.setApplicationMenu(menu)
    }
  }

  const menu = new Menu()

  /**
   * FILE
   */

  const fileSubMenu = new Menu()
  const fileMenuItem = new MenuItem({
    label: '&File',
    submenu: fileSubMenu
  })
  const openItem = new MenuItem({
    label: '&Open File...',
    accelerator: 'CmdOrCtrl+O',
    click: () => {
      dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: 'Open File',
        properties: ['openFile']
      }, (files) => {
        if (files && files.length) {
          openFile(files[0], (data) => {
            actions.createWorkspace(data)
          })
        }
      })
    }
  })
  fileSubMenu.append(openItem)

  const saveAsItem = new MenuItem({
    label: '&Save As...',
    accelerator: process.browser ? 'CmdOrCtrl+S' : 'Shift+CmdOrCtrl+S',
    enabled: false,
    id: 'saveAs',
    click: () => {
      actions.saveFile()
    }
  })
  fileSubMenu.append(saveAsItem)

  subscribe(() => {
    let state = getState()
    let enable = state.workspace.get('currentWorkspace') !== null
    if (saveAsItem.enabled !== enable) {
      saveAsItem.enabled = enable
      updateMenu()
    }
  })

  if (!process.browser) {
    fileSubMenu.append(new MenuItem({type: 'separator'}))
    const quitItem = new MenuItem({
      label: 'Quit',
      accelerator: 'CmdOrCtrl+Q',
      click: () => {
        remote.app.quit()
      }
    })
    fileSubMenu.append(quitItem)
  }

  menu.append(fileMenuItem)

  /**
   * EDIT
   */

  const editSubMenu = new Menu()
  const editMenuItem = new MenuItem({
    label: '&Edit',
    submenu: editSubMenu
  })

  const newDirectoryItem = new MenuItem({
    label: 'New &Directory',
    accelerator: process.browser ? 'Shift+N' : 'CmdOrCtrl+N',
    enabled: false,
    click: () => {
      actions.createDirectory()
    }
  })
  editSubMenu.append(newDirectoryItem)

  const newTextureItem = new MenuItem({
    label: 'New &Texture',
    accelerator: process.browser ? 'Shift+T' : 'CmdOrCtrl+T',
    enabled: false,
    click: () => {
      actions.createTexture()
    }
  })
  editSubMenu.append(newTextureItem)

  subscribe(() => {
    let state = getState()
    let workspace = state.workspace.get('currentWorkspace')
    let enable = workspace !== null && state.workspace.getIn([workspace, 'selectedDirectory']) !== null
    let shouldUpdate = false
    if (newDirectoryItem.enabled !== enable) {
      newDirectoryItem.enabled = enable
      shouldUpdate = true
    }
    if (newTextureItem.enabled !== enable) {
      newTextureItem.enabled = enable
      shouldUpdate = true
    }
    if (shouldUpdate) {
      updateMenu()
    }
  })

  menu.append(editMenuItem)

  /**
   * VIEW
   */

  const viewSubMenu = new Menu()
  const viewMenuItem = new MenuItem({
    label: '&View',
    submenu: viewSubMenu
  })
  const fullscreenItem = new MenuItem({
    label: 'Toggle &Full screen',
    accelerator: 'F11',
    click: () => {
      const focused = remote.getCurrentWindow()
      focused.setFullScreen(!focused.isFullScreen())
    }
  })
  viewSubMenu.append(fullscreenItem)

  const resetPanelsItem = new MenuItem({
    label: '&Reset Panels',
    click: () => {
      actions.resetPanels()
    }
  })
  viewSubMenu.append(resetPanelsItem)

  menu.append(viewMenuItem)

  /**
   * DEBUG
   */

  if (argv._.indexOf('debug') > -1) {
    const debugSubMenu = new Menu()
    const debugMenuItem = new MenuItem({
      label: '&Debug',
      submenu: debugSubMenu
    })

    const reloadItem = new MenuItem({
      label: '&Reload',
      accelerator: 'CmdOrCtrl+R',
      click: () => {
        remote.getCurrentWindow().reload()
      }
    })
    debugSubMenu.append(reloadItem)

    if (!process.browser) {
      const restartItem = new MenuItem({
        label: 'R&estart',
        accelerator: 'Shift+CmdOrCtrl+R',
        click: () => {
          remote.app.relaunch()
          remote.app.quit()
        }
      })
      debugSubMenu.append(restartItem)

      const toggleDevToolsItem = new MenuItem({
        label: 'Toggle &DevTools',
        accelerator: 'Shift+CmdOrCtrl+I',
        click: () => {
          remote.getCurrentWindow().toggleDevTools()
        }
      })
      debugSubMenu.append(toggleDevToolsItem)
    }
    menu.append(debugMenuItem)
  }

  /**
   * HELP
   */

  const helpSubMenu = new Menu()
  const helpMenuItem = new MenuItem({
    label: '&Help',
    submenu: helpSubMenu
  })

  const versionItem = new MenuItem({
    label: 'Version ' + remote.app.getVersion(),
    enabled: false
  })
  helpSubMenu.append(versionItem)

  helpSubMenu.append(new MenuItem({type: 'separator'}))

  const aboutItem = new MenuItem({
    label: '&About ' + remote.app.getName(),
    click: () => {
      actions.toggleAboutDialog(true)
    }
  })
  helpSubMenu.append(aboutItem)

  menu.append(helpMenuItem)

  /**
   * Set Menu
   */

  updateMenu()

  return menu
}

export default initializeMenu
