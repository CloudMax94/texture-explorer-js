var app = require('app');  // Module to control application life.
var path = require('path');
var fs = require('fs');
var BrowserWindow = require('browser-window');  // Module to create native browser window.
argv = require('minimist')(process.argv.slice(1));

if (argv.browsermenu) {
    console.log("enable browser menu");
}
console.log(argv);

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    if (process.platform != 'darwin')
        app.quit();
});

// This method will be called when atom-shell has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 600, icon: path.join(__dirname, 'icon.png')});
    // and load the index.html of the app.

    var jade = require('jade');
    var html = jade.renderFile(__dirname+'/main.jade');
    fs.writeFileSync(__dirname+'/index.html', html);
    mainWindow.loadUrl('file://' + __dirname + '/index.html');
    mainWindow.toggleDevTools();
    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
});