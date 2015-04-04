var _             = require('lodash');
var remote        = require('remote');
var argv          = remote.getGlobal('argv');
var dialog        = remote.require('dialog');
var Menu          = remote.require('menu');
var MenuItem      = remote.require('menu-item');

var template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open File...',
                accelerator: 'CmdOrCtrl+O',
                click: function() {
                    dialog.showOpenDialog(remote.getCurrentWindow(), {
                        title: 'Open File...',
                        properties: ['openFile']
                    });
                }
            },
            {
                label: 'Open Recent',
                submenu: [
                    {
                        label: 'Test Item',
                        click: function() {}
                    },
                    {
                        label: 'Test Item',
                        click: function() {}
                    },
                    {
                        label: 'Test Item',
                        click: function() {}
                    },
                    {
                        type: 'separator'
                    },
                    {
                        label: 'Clear Items',
                        click: function() {}
                    },
                ]
            },
            {
                label: 'Save',
                accelerator: 'CmdOrCtrl+S',
                click: function() {

                }
            },
            {
                label: 'Save As...',
                accelerator: 'Shift+CmdOrCtrl+S',
                click: function() {

                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                accelerator: 'CmdOrCtrl+Q',
                click: function() {
                    require('remote').require('app').quit();
                }
            },
        ]
    },
    {
        label: 'View',
        submenu: [
            {
                label: 'Full screen',
                accelerator: 'F11',
                click: function() {
                    var focused = remote.getCurrentWindow();
                    focused.setFullScreen(!focused.isFullScreen());
                }
            }
        ]
    },
    {
        label: 'Profile',
        submenu: [
            {
                label: 'New Profile',
                click: function() {

                }
            },
            {
                label: 'Open Profile...',
                click: function() {

                }
            },
            {
                label: 'Open Recent',
                submenu: [
                    {
                        label: 'Test Item',
                        click: function() {}
                    },
                    {
                        label: 'Test Item',
                        click: function() {}
                    },
                    {
                        label: 'Test Item',
                        click: function() {}
                    },
                    {
                        type: 'separator'
                    },
                    {
                        label: 'Clear Items',
                        click: function() {}
                    },
                ]
            },
            {
                label: 'Save Profile',
                click: function() {

                }
            },
            {
                label: 'Save Profile As...',
                click: function() {

                }
            },
        ]
    },
    {
        label: 'Debug',
        submenu: [
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click: function() { remote.getCurrentWindow().reloadIgnoringCache(); }
            },
            {
                label: 'Toggle DevTools',
                accelerator: 'Shift+CmdOrCtrl+I',
                click: function() { remote.getCurrentWindow().toggleDevTools(); }
            },
        ]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'About Texture Explorer.js',
                click: function() { }
            },
        ]
    },
];

var menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

if (argv._.indexOf('browsermenu') > -1) {
    var shimRemote = require('../shims/remote');
    Menu = shimRemote.require('menu');
    MenuItem = shimRemote.require('menu-item');
    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}