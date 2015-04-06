/*jslint node:true, browser: true, esnext: true */
"use strict";
var _ = require('lodash');
class GlobalKeys {
    constructor() {
        var self = this;
        this.keyBindings = [];
        this.assignedKeys = [];
        document.addEventListener("keydown", function(event){self.triggerBinding(event);});
    }
    add(accelerator, callback) {
        var o = {
            callback: callback,
            shiftKey: false,
            cmdorctrlKey: false
        };
        var keys = accelerator.toLowerCase().split('+');
        if (keys.indexOf('shift') > -1) {
            o.shiftKey = true;
        }
        if (keys.indexOf('cmdorctrl') > -1) {
            o.cmdorctrlKey = true;
        }
        keys = _.reject(keys, function(v) {
            return v == 'shift' || v == 'cmdorctrl';
        });
        o.key = keys[0].toUpperCase();
        if (o.key.length === 1) {
            o.which = o.key.charCodeAt(0);
        } else {
            if (/^F[1-9][0-2]?$/.test(o.key)) {
                o.which = 111+parseInt(o.key.substr(1));
            } else {
                o.which = null;
            }
        }
        this.keyBindings.push(o);
        this.updateAssignedKeys();
        return o;
    }
    updateAssignedKeys() {
        this.assignedKeys = _.uniq(_.map(this.keyBindings, 'which'));
    }
    getBinding(event) {
        if (this.assignedKeys.indexOf(event.which) == -1) {
            return;
        }
        return _.findWhere(this.keyBindings, {
            shiftKey: event.shiftKey,
            cmdorctrlKey: (event.metaKey || event.ctrlKey),
            which: event.which
        });
    }
    triggerBinding(event) {
        var binding = this.getBinding(event);
        if (binding) {
            binding.callback();
        };
    }
    unbind(binding) {
        this.keyBindings.splice(this.keyBindings.indexOf(binding), 1);
        this.updateAssignedKeys();
    }
}
var globalKeys = new GlobalKeys;


class MenuItem {
    constructor(data){
        if (data.type && data.type == 'separator') {
            this.e = document.createElement('menu-separator');
            return;
        }
        this.globalKeyObject = null;
        this.e = document.createElement('menu-item');
        this.label = data.label;
        this.click = data.click;
        this.enabled = data.enabled;
        if (data.accelerator) {
            this.accelerator = data.accelerator;
        }
        if (data.submenu) {
            this.submenu = data.submenu;
            this.e.appendChild(this.submenu.e);
            this.e.classList.add('parent');
        }
    }

    set accelerator(data) {
        var self = this;
        if (this.globalKeyObject) {
            globalKeys.unbind(this.globalKeyObject);
        }
        this.globalKeyObject = globalKeys.add(data, function(event){self.e.click(event)});
    }

    set label(data) {
        this.e.innerHTML = data;
    }

    set click(data) {
        if (!data) {
            this.e.onclick = data;
            return;
        }
        var self = this;
        this.e.onclick = function(){
            var parentEle = self.e.parentNode;
            while (parentEle !== null && parentEle.tagName != 'CONTEXT-MENU') {
                parentEle = parentEle.parentNode;
            }
            if (parentEle) {
                parentEle.remove();
            }
            data();
        };
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