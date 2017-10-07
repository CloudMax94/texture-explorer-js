import { openFile } from './fileHandler'
// import Popup from './popup'
import { remote } from 'electron'
import { bindActionCreators } from 'redux'
import { resetPanels } from '../actions/interface'
import {
  createWorkspace,
  saveFile,
  createDirectory,
  createTexture
} from '../actions/workspace'
const { Menu, MenuItem, dialog } = remote
const argv = remote.getGlobal('argv')

function initializeMenu (dispatch) {
  const actions = bindActionCreators({
    resetPanels,
    createWorkspace,
    saveFile,
    createDirectory,
    createTexture
  }, dispatch)

  const menu = new Menu()

  /**
   * FILE
   */

  const fileSubMenu = new Menu()
  const fileMenuItem = new MenuItem({
    label: 'File',
    submenu: fileSubMenu
  })
  const openItem = new MenuItem({
    label: 'Open File...',
    accelerator: 'CmdOrCtrl+O',
    click: () => {
      dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: 'Open File',
        properties: ['openFile']
      }, (files) => {
        if (files.length) {
          openFile(files[0], (data) => {
            actions.createWorkspace(data)
          })
        }
      })
    }
  })
  fileSubMenu.append(openItem)

  const saveAsItem = new MenuItem({
    label: 'Save As...',
    accelerator: process.browser ? 'CmdOrCtrl+S' : 'Shift+CmdOrCtrl+S',
    click: () => {
      actions.saveFile()
    }
  })
  fileSubMenu.append(saveAsItem)

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
    label: 'Edit',
    submenu: editSubMenu
  })

  const newDirectoryItem = new MenuItem({
    label: 'New Directory',
    accelerator: 'Shift+N',
    click: () => {
      actions.createDirectory()
    }
  })
  editSubMenu.append(newDirectoryItem)

  const newTextureItem = new MenuItem({
    label: 'New Texture',
    accelerator: 'Shift+T',
    click: () => {
      actions.createTexture()
    }
  })
  editSubMenu.append(newTextureItem)

  menu.append(editMenuItem)

  /**
   * VIEW
   */

  const viewSubMenu = new Menu()
  const viewMenuItem = new MenuItem({
    label: 'View',
    submenu: viewSubMenu
  })
  const fullscreenItem = new MenuItem({
    label: 'Full screen',
    accelerator: 'F11',
    click: () => {
      const focused = remote.getCurrentWindow()
      focused.setFullScreen(!focused.isFullScreen())
    }
  })
  viewSubMenu.append(fullscreenItem)

  const resetPanelsItem = new MenuItem({
    label: 'Reset Panels',
    click: () => {
      actions.resetPanels()
    }
  })
  viewSubMenu.append(resetPanelsItem)

  menu.append(viewMenuItem)

  /**
   * PROFILE
   */

  const profileSubMenu = new Menu()
  const profileMenuItem = new MenuItem({
    label: 'Profile',
    submenu: profileSubMenu
  })

  const newProfileItem = new MenuItem({
    label: 'New Profile',
    click: () => {
    }
  })
  profileSubMenu.append(newProfileItem)

  const openProfileItem = new MenuItem({
    label: 'Open Profile...',
    click: () => {
    }
  })
  profileSubMenu.append(openProfileItem)

  const saveProfileItem = new MenuItem({
    label: 'Save Profile',
    click: () => {

    }
  })
  profileSubMenu.append(saveProfileItem)

  const saveProfileAsItem = new MenuItem({
    label: 'Save Profile As...',
    click: () => {

    }
  })
  profileSubMenu.append(saveProfileAsItem)

  menu.append(profileMenuItem)

  /**
   * DEBUG
   */

  if (argv._.indexOf('debug') > -1) {
    const debugSubMenu = new Menu()
    const debugMenuItem = new MenuItem({
      label: 'Debug',
      submenu: debugSubMenu
    })

    const reloadItem = new MenuItem({
      label: 'Reload',
      accelerator: 'CmdOrCtrl+R',
      click: () => {
        remote.getCurrentWindow().reload()
      }
    })
    debugSubMenu.append(reloadItem)

    if (!process.browser) {
      const restartItem = new MenuItem({
        label: 'Restart',
        accelerator: 'Shift+CmdOrCtrl+R',
        click: () => {
          remote.app.relaunch()
          remote.app.quit()
        }
      })
      debugSubMenu.append(restartItem)

      const toggleDevToolsItem = new MenuItem({
        label: 'Toggle DevTools',
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
    label: 'Help',
    submenu: helpSubMenu
  })

  const aboutItem = new MenuItem({
    label: 'About Texture Explorer.js',
    click: () => {
      /* TODO: rewrite Popup. Create an interface action for it.
      var dialogWindow = new Popup({
        title: 'About Texture Explorer.js',
        content: 'Website: cloudmodding.com<br>Created by CloudMax 2015.',
        buttons: [{text: 'Close', click: function (event, popup) {
          popup.close();
        }}],
        closeBtn: true
      })
      console.log(dialogWindow)
      dialogWindow.show()
      */
    }
  })
  helpSubMenu.append(aboutItem)

  menu.append(helpMenuItem)

  /**
   * Set Menu
   */

  Menu.setApplicationMenu(menu)

  return menu
}

export default initializeMenu
