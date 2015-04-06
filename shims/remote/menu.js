/*jslint node:true, browser: true, esnext: true */
"use strict";

var _           = require('lodash');
var MenuItem    = require('./menu-item');

class Menu {
    constructor(){
        this.e = document.createElement('menu-items');
    }
    append(item) {
        this.e.appendChild(item.e);
    }
    popup(w) {
        var contextmenus = document.querySelectorAll('context-menu');
        _.each(contextmenus, function(e){
            e.parentNode.removeChild(e);
        });
        var contextmenu = document.createElement('context-menu');
        contextmenu.style.top = event.clientY+'px';
        contextmenu.style.left = event.clientX+'px';
        contextmenu.appendChild(this.e);
        document.body.appendChild(contextmenu);
    }
}
Menu.setApplicationMenu = function(menu) {
    var _cb = function(){
        var appContainer = document.getElementById('app');
        _.each(document.querySelectorAll('menu-bar'), function(e){
            e.parentNode.removeChild(e);
        });
        var bar = document.createElement('menu-bar');
        bar.appendChild(menu.e);
        appContainer.insertBefore(bar, appContainer.firstChild);
    };
    if (document.readyState === 'complete') {
        _cb();
    } else {
        document.addEventListener("DOMContentLoaded", function(event) {
            _cb();
        });
    }
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
}
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