const remote        = require('remote');
const argv          = remote.getGlobal('argv');
const dialog        = remote.require('dialog');
let Menu            = remote.require('menu');
let MenuItem        = remote.require('menu-item');
// var Popup         = require('./popup');

const interfaceActions = require('../actions/interface');
const workspaceStore = require('../stores/workspace');
const fileHandler   = require('./fileHandler');

if (argv._.indexOf('browsermenu') > -1) {
    const shimRemote = require('./shims/remote');
    Menu = shimRemote.require('menu');
    MenuItem = shimRemote.require('menu-item');
}

const menu = new Menu();

/**
 * FILE
 */

const fileSubMenu = new Menu();
const fileMenuItem = new MenuItem({
    label: 'File',
    submenu: fileSubMenu,
});
const openItem = new MenuItem({
    label: 'Open File...',
    accelerator: 'CmdOrCtrl+O',
    click: () => {
        dialog.showOpenDialog(remote.getCurrentWindow(), {
            title: 'Open File',
            properties: ['openFile'],
        }, (files) => {
            console.log(files);
            fileHandler.openFile(files[0]);
        });
    },
});
fileSubMenu.append(openItem);

if (!process.browser) {
    const openRecentSubMenu = new Menu();
    const openRecentItem = new MenuItem({
        label: 'Open Recent',
        submenu: openRecentSubMenu,
    });

    let recent = localStorage.getItem('recent_files');
    if (recent !== null) {
        recent = JSON.parse(recent);
    } else {
        recent = [];
    }
    const openRecentPath = function openRecentPath(path) {
        fileHandler.openFile(path);
    };
    for (let i = 0; i < recent.length; i++) {
        const recentPath = recent[i];
        openRecentSubMenu.append(new MenuItem({
            label: recentPath,
            click: openRecentPath.bind(this, recentPath),
        }));
    }
    openRecentSubMenu.append(new MenuItem({type: 'separator'}));
    openRecentSubMenu.append(new MenuItem({
        label: 'Clear Items',
        click: () => {
            fileHandler.clearRecent();
        },
    }));
    fileSubMenu.append(openRecentItem);
}

/*
const saveItem = new MenuItem({
    label: 'Save',
    accelerator: 'CmdOrCtrl+S',
    click: () => {
        console.log('Save');
    },
});
fileSubMenu.append(saveItem);
*/

if (!process.browser) {
    const saveAsItem = new MenuItem({
        label: 'Save As...',
        accelerator: 'Shift+CmdOrCtrl+S',
        click: () => {
            dialog.showSaveDialog(remote.getCurrentWindow(), {
                title: 'Save File',
                defaultPath: workspaceStore.getCurrentWorkspace().get('path'),
            }, (filePath) => {
                console.log(filePath);
                const data = workspaceStore.getCurrentWorkspace().get('data');
                fileHandler.saveFile(filePath, data, (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('saved!');
                    }
                });
            });
        },
    });
    fileSubMenu.append(saveAsItem);

    fileSubMenu.append(new MenuItem({type: 'separator'}));

    const quitItem = new MenuItem({
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
            require('remote').require('app').quit();
        },
    });
    fileSubMenu.append(quitItem);
}

menu.append(fileMenuItem);

/**
 * VIEW
 */

const viewSubMenu = new Menu();
const viewMenuItem = new MenuItem({
    label: 'View',
    submenu: viewSubMenu,
});
const fullscreenItem = new MenuItem({
    label: 'Full screen',
    accelerator: 'F11',
    click: () => {
        const focused = remote.getCurrentWindow();
        focused.setFullScreen(!focused.isFullScreen());
    },
});
viewSubMenu.append(fullscreenItem);

const resetPanelsItem = new MenuItem({
    label: 'Reset Panels',
    click: () => {
        interfaceActions.resetPanels();
    },
});
viewSubMenu.append(resetPanelsItem);

menu.append(viewMenuItem);

/**
 * PROFILE
 */

const profileSubMenu = new Menu();
const profileMenuItem = new MenuItem({
    label: 'Profile',
    submenu: profileSubMenu,
});

const newProfileItem = new MenuItem({
    label: 'New Profile',
    click: () => {
    },
});
profileSubMenu.append(newProfileItem);

const openProfileItem = new MenuItem({
    label: 'Open Profile...',
    click: () => {
    },
});
profileSubMenu.append(openProfileItem);

const openRecentProfileSubMenu = new Menu();
const openRecentProfileItem = new MenuItem({
    label: 'Open Recent',
    submenu: openRecentProfileSubMenu,
});
for (let i = 0; i < 5; i++) {
    openRecentProfileSubMenu.append(new MenuItem({label: 'Profile '+i}));
}
profileSubMenu.append(openRecentProfileItem);

const saveProfileItem = new MenuItem({
    label: 'Save Profile',
    click: () => {

    },
});
profileSubMenu.append(saveProfileItem);

const saveProfileAsItem = new MenuItem({
    label: 'Save Profile As...',
    click: () => {

    },
});
profileSubMenu.append(saveProfileAsItem);

menu.append(profileMenuItem);

/**
 * DEBUG
 */

if (argv._.indexOf('debug') > -1) {
    const debugSubMenu = new Menu();
    const debugMenuItem = new MenuItem({
        label: 'Debug',
        submenu: debugSubMenu,
    });

    const reloadItem = new MenuItem({
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
            remote.getCurrentWindow().reloadIgnoringCache();
        },
    });
    debugSubMenu.append(reloadItem);

    if (!process.browser) {
        const toggleDevToolsItem = new MenuItem({
            label: 'Toggle DevTools',
            accelerator: 'Shift+CmdOrCtrl+I',
            click: () => {
                remote.getCurrentWindow().toggleDevTools();
            },
        });
        debugSubMenu.append(toggleDevToolsItem);
    }
    menu.append(debugMenuItem);
}

/**
 * HELP
 */

const helpSubMenu = new Menu();
const helpMenuItem = new MenuItem({
    label: 'Help',
    submenu: helpSubMenu,
});

const aboutItem = new MenuItem({
    label: 'About Texture Explorer.js',
    click: () => {
        /*
        var dialogWindow = new Popup({
            title:      'About Texture Explorer.js',
            content:    'Website: cloudmodding.com<br>Created by CloudMax 2015.',
            buttons:    [{text: 'Close', click: function(event, popup){
                popup.close();
            }}],
            closeBtn:   true
        });
        console.log(dialogWindow);
        dialogWindow.show();
        */
    },
});
helpSubMenu.append(aboutItem);

menu.append(helpMenuItem);

/**
 * Set Menu
 */

Menu.setApplicationMenu(menu);
module.exports = menu;
