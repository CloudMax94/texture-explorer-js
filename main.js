const { app, BrowserWindow } = require('electron')
const windowStateKeeper = require('electron-window-state')
global.argv = require('minimist')(process.argv.slice(1))
const path = require('path')

var mainWindow = null

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
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      zoomFactor: argv.scale ? argv.scale : 1
    },
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#262626'
  })

  mainWindowState.manage(mainWindow)

  mainWindow.loadURL('file://' + __dirname + '/index.html')

  if (global.argv._.indexOf('debug') > -1) {
    mainWindow.openDevTools({
      mode: 'bottom'
    })
  }

  mainWindow.on('closed', function () {
    mainWindow = null
  })
})
