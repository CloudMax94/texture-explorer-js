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
      zoomFactor: global.argv.scale ? global.argv.scale : 1,
      webSecurity: false
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    backgroundColor: '#262626'
  })

  mainWindowState.manage(mainWindow)

  var loaded = false
  var css
  var sass = require('node-sass')
  sass.render({
    file: require('path').join(__dirname, '/src/sass/style.scss'),
    sourcemap: true,
    sourceMapEmbed: true,
    sourceMapContents: true,
    outputStyle: 'compact'
  }, function (error, result) {
    if (error) {
      css = 'body:before {content: "'
      css += 'SASS Error: ' + error.message.replace(/"/g, '\\"') + ' \\A '
      css += 'on line ' + error.line + ' column ' + error.column + ' in ' + error.file + ' \\A '
      css += '"; white-space: pre; display: block; padding: 0.5em; border: 2px solid red;}#container {display:none}'
    } else {
      css = result.css.toString()
    }
    if (loaded) {
      mainWindow.webContents.insertCSS(css)
    }
  })

  mainWindow.webContents.on('did-finish-load', function () {
    if (css) {
      mainWindow.webContents.insertCSS(css)
    }
  })

  mainWindow.loadURL(path.join('file://', __dirname, '/src/electron.html'))

  if (global.argv._.indexOf('debug') > -1) {
    mainWindow.openDevTools({
      mode: 'bottom'
    })
  }

  mainWindow.on('closed', function () {
    mainWindow = null
  })
})
