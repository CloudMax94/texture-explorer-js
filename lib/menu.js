/*jslint node:true, browser: true */
var _             = require('lodash');
var remote        = require('remote');
var argv          = remote.getGlobal('argv');
var dialog        = remote.require('dialog');
var Menu          = remote.require('menu');
var MenuItem      = remote.require('menu-item');

if (argv._.indexOf('browsermenu') > -1) {
    var shimRemote = require('../shims/remote');
    Menu = shimRemote.require('menu');
    MenuItem = shimRemote.require('menu-item');
}

/**
 * FILE
 */

var fileSubMenu = new Menu();
var fileMenuItem = new MenuItem({
    label: 'File',
    submenu: fileSubMenu
});
var openItem = new MenuItem({
    label: 'Open File...',
    accelerator: 'CmdOrCtrl+O',
    click: function() {
        dialog.showOpenDialog(remote.getCurrentWindow(), {
            title: 'Open File...',
            properties: ['openFile']
        });
    }
});
fileSubMenu.append(openItem);

if (!process.browser) {
    var openRecentSubMenu = new Menu();
    var openRecentItem = new MenuItem({
        label: 'Open Recent',
        submenu: openRecentSubMenu
    });
    for (var i = 0; i < 5; i++) {
        openRecentSubMenu.append(new MenuItem({label: 'item '+i}));
    }
    fileSubMenu.append(openRecentItem);
}

var saveItem = new MenuItem({
    label: 'Save',
    accelerator: 'CmdOrCtrl+S',
    click: function() {
        console.log("Save");
    }
});
fileSubMenu.append(saveItem);

if (!process.browser) {
    var saveAsItem = new MenuItem({
        label: 'Save As...',
        accelerator: 'Shift+CmdOrCtrl+S',
        click: function() {
            console.log("Save As...");
        }
    });
    fileSubMenu.append(saveAsItem);

    fileSubMenu.append(new MenuItem({type: 'separator'}));

    var quitItem = new MenuItem({
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: function() {
            require('remote').require('app').quit();
        }
    });
    fileSubMenu.append(quitItem);
}

/**
 * VIEW
 */

var viewSubMenu = new Menu();
var viewMenuItem = new MenuItem({
    label: 'View',
    submenu: viewSubMenu
});
var fullscreenItem = new MenuItem({
    label: 'Full screen',
    accelerator: 'F11',
    click: function() {
        var focused = remote.getCurrentWindow();
        focused.setFullScreen(!focused.isFullScreen());
    }
});
viewSubMenu.append(fullscreenItem);

/**
 * PROFILE
 */

var profileSubMenu = new Menu();
var profileMenuItem = new MenuItem({
    label: 'Profile',
    submenu: profileSubMenu
});

var newProfileItem = new MenuItem({
    label: 'New Profile',
    click: function() {
    }
});
profileSubMenu.append(newProfileItem);

var openProfileItem = new MenuItem({
    label: 'Open Profile...',
    click: function() {
    }
});
profileSubMenu.append(openProfileItem);

var openRecentProfileSubMenu = new Menu();
var openRecentProfileItem = new MenuItem({
    label: 'Open Recent',
    submenu: openRecentProfileSubMenu
});
for (var i = 0; i < 5; i++) {
    openRecentProfileSubMenu.append(new MenuItem({label: 'item '+i}));
}
profileSubMenu.append(openRecentProfileItem);

var saveProfileItem = new MenuItem({
    label: 'Save Profile',
    click: function() {

    }
});
profileSubMenu.append(saveProfileItem);

var saveProfileAsItem = new MenuItem({
    label: 'Save Profile As...',
    click: function() {

    }
});
profileSubMenu.append(saveProfileAsItem);

/**
 * DEBUG
 */

if (argv._.indexOf('debug') > -1) {
    var debugSubMenu = new Menu();
    var debugMenuItem = new MenuItem({
        label: 'Debug',
        submenu: debugSubMenu
    });

    var reloadItem = new MenuItem({
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function() { remote.getCurrentWindow().reloadIgnoringCache(); }
    });
    debugSubMenu.append(reloadItem);

    if (!process.browser) {
        var toggleDevToolsItem = new MenuItem({
            label: 'Toggle DevTools',
            accelerator: 'Shift+CmdOrCtrl+I',
            click: function() { remote.getCurrentWindow().toggleDevTools(); }
        });
        debugSubMenu.append(toggleDevToolsItem);
    }
}

/**
 * HELP
 */

var helpSubMenu = new Menu();
var helpMenuItem = new MenuItem({
    label: 'Help',
    submenu: helpSubMenu
});

var aboutItem = new MenuItem({
    label: 'About Texture Explorer.js',
    click: function() { }
});
helpSubMenu.append(aboutItem);

/**
 * BUILD
 */

var menu = new Menu();
menu.append(fileMenuItem);
menu.append(viewMenuItem);
menu.append(profileMenuItem);
menu.append(debugMenuItem);
menu.append(helpMenuItem);
Menu.setApplicationMenu(menu);