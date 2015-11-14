var app = require('app');
var path = require('path');
var fs = require('fs');
var BrowserWindow = require('browser-window');
argv = require('minimist')(process.argv.slice(1));

require('crash-reporter').start();

var mainWindow = null;

app.on('window-all-closed', function() {
    if (process.platform != 'darwin')
        app.quit();
});

app.on('ready', function() {
    mainWindow = new BrowserWindow({width: 800, height: 600, icon: path.join(__dirname, 'icon.png')});

    mainWindow.loadUrl('file://' + __dirname + '/index.html');

    if (argv._.indexOf('debug') > -1) {
        mainWindow.toggleDevTools();
    }

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});
