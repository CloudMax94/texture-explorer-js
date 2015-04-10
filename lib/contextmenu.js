/*jslint node:true, browser: true */
"use strict";

var _ = require('lodash');
var fs = require('fs');
var remote = require('remote');
var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');
var dialog = remote.require('dialog');
var textureManipulator  = require('./textureManipulator');

var argv = remote.getGlobal('argv');
if (argv._.indexOf('browsercontext') > -1) {
    remote = require('../shims/remote');
    Menu = remote.require('menu');
    MenuItem = remote.require('menu-item');
}

document.getElementById('mainTree').addEventListener('contextmenu', function (event) {
    if (event.target.tagName == 'TREE-ITEM') {
        event.preventDefault();
        var obj = event.target.object;
        var menu = new Menu();
        menu.append(new MenuItem({ label: 'Remove '+_.capitalize(obj.type), click: function() {
            obj.destroy();
        }}));
        menu.append(new MenuItem({ label: 'New Directory', click: function() {
            var container = obj.container;
            var directory = container.newItem('directory');
            directory.createElement();
            directory.setData('name', 'New Directory');
            directory.setData('address', 0);
            directory.setData('size', obj.getData('size'));
            directory.setParent(obj);
        }}));
        menu.append(new MenuItem({ label: 'New Texture', click: function() {
            var container = obj.container;
            var texture = container.newItem('texture');
            texture.createElement();
            texture.setData('name', 'New Texture');
            texture.setData('address', 0);
            texture.setData('format', textureManipulator.getFormat('rgba32'));
            texture.setData('width', 32);
            texture.setData('height', 32);
            texture.setParent(obj);
        }}));
        if (obj.type == 'texture') {
            menu.append(new MenuItem({ type: 'separator' }));
            menu.append(new MenuItem({ label: 'Extract Texture', click: function() {
                obj.getTexture(function(texture){
                    //need to create a wrapper function to allow saving textures both app & browser mode
                    texture.toPNGBuffer(function(buffer){
                        dialog.showSaveDialog(remote.getCurrentWindow(), {
                            title: 'Save '+obj.getData('name'),
                            filters: [
                                {name: 'Images', extensions: ['png']},
                            ]
                        }, function(filename){
                            if (filename) {
                                console.log("saving!");
                                fs.writeFile(filename, buffer, {}, function(err){
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log("saved!");
                                    }
                                });
                            } else {
                                console.log("no path specified, not saving.");
                            }
                        });
                    });
                });
            } }));
        }
        menu.popup(remote.getCurrentWindow(), event.clientX, event.clientY);
    }
}, false);
