/*jslint node:true, browser: true, esnext: true */
"use strict";

class MenuItem {
    constructor(data){
        var self = this;
        if (data.type && data.type == 'separator') {
            self.e = document.createElement('menu-separator');
            return;
        }
        self.e = document.createElement('menu-item');
        self.label = data.label;
        self.click = data.click;
        self.enabled = data.enabled;
        if (data.submenu) {
            self.submenu = data.submenu;
            self.e.appendChild(self.submenu.e);
            self.e.classList.add('parent');
        }
    }

    set label(data) {
        this.e.innerHTML = data;
    }

    set click(data) {
        this.e.onclick = data;
    }

    set enabled(data) {
        if (data === false) {
            this.e.disabled = true;
        } else {
            this.e.disabled = false;
        }
    }
}

module.exports = MenuItem;