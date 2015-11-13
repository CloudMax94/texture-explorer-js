/*jslint node:true, browser: true, esnext: true */
"use strict";

var _                = require('lodash');
var MenuItem         = require('./menu-item');
var interfaceActions = require('../../../actions/interface');

class Menu {
    constructor(){
        this.items = [];
    }
    append(item) {
        this.items.push(item);
    }
    popup(browserWindow, x, y) {
        var contextmenus = document.querySelectorAll('context-menu');
        _.each(contextmenus, function(element){
            element.parentNode.removeChild(element);
        });
        var contextmenu = document.createElement('context-menu');
        contextmenu.style.top = y+'px';
        contextmenu.style.left = x+'px';
        //contextmenu.appendChild(this.e);
        document.body.appendChild(contextmenu);
    }
}
Menu.setApplicationMenu = function(menu) {
    interfaceActions.setApplicationMenu(menu);
};
var buildFromTemplateSubmenus = function(item) {
    if (item.submenu) {
        var submenu = new Menu();
        _.each(item.submenu, function(i){
            i = buildFromTemplateSubmenus(i);
            var subitem = new MenuItem(i);
            submenu.append(subitem);
        });
        item.submenu = submenu;
    }
    return item;
};
Menu.buildFromTemplate = function(template) {
    var menu = new Menu();
    _.each(template, function(i){
        i = buildFromTemplateSubmenus(i);
        var item = new MenuItem(i);

        menu.append(item);
    });
    return menu;
};

module.exports = Menu;
