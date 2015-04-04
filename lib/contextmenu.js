/*jslint node:true, browser: true */
"use strict";

var _ = require('lodash');
var fs = require('fs');
var remote = require('remote');
var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');
var dialog = remote.require('dialog');
document.getElementById('mainTree').addEventListener('contextmenu', function (e) {
    if (e.target.tagName == 'TREE-ITEM') {
        e.preventDefault();
        var obj = e.target.object;
        var menu = new Menu();
        menu.append(new MenuItem({ label: 'Remove '+_.capitalize(obj.type), click: function() {
            var container = obj.container;
            obj.destroy();
        }}));
        menu.append(new MenuItem({ type: 'separator' }));
        if (obj.type == 'texture') {
            menu.append(new MenuItem({ label: 'Extract Texture', click: function() {
                obj.getTexture(function(texture){
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
        menu.popup(remote.getCurrentWindow());
    }
}, false);