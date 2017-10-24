const { app, BrowserWindow } = require('electron')
const windowStateKeeper = require('electron-window-state')
global.argv = require('minimist')(process.argv.slice(1))
const path = require('path')
const debugMode = global.argv._.indexOf('debug') > -1

var mainWindow = null

if (global.argv['scale-factor']) {
  app.commandLine.appendSwitch('high-dpi-support', 'true')
  app.commandLine.appendSwitch('force-device-scale-factor', global.argv['scale-factor'])
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('ready', function () {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 600
  })

  mainWindow = new BrowserWindow({
    show: false,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      zoomFactor: global.argv['zoom-factor'] ? global.argv['zoom-factor'] : 1,
      webSecurity: false
    },
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#262626'
  })

  mainWindowState.manage(mainWindow)

  mainWindow.loadURL(`file://${__dirname}/electron.html`)

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined')
    }
    mainWindow.show()
    mainWindow.focus()
  })

  if (debugMode) {
    mainWindow.openDevTools({
      mode: 'bottom'
    })
  }

  mainWindow.on('closed', function () {
    mainWindow = null
  })
})