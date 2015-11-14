"use strict";
var _ = require('lodash');
class GlobalKeys {
    constructor() {
        this.keyBindings = [];
        this.assignedKeys = [];
        document.addEventListener("keydown", (event) => {
            if (!document.querySelector('dialog[open]'))
                this.triggerBinding(event);
        });
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
        o.text = GlobalKeys.acceleratorToText(accelerator);
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
            binding.callback(event);
        }
    }
    unbind(binding) {
        this.keyBindings.splice(this.keyBindings.indexOf(binding), 1);
        this.updateAssignedKeys();
    }
}
GlobalKeys.acceleratorToText = function(accelerator) {
    //Generic
    var special = {
        cmdorctrl:  'Ctrl',
        plus:       '+',
        minus:      '-',
    };
    var separator = '+';
    if (process.platform == 'darwin' || window.navigator.platform.toLowerCase().indexOf('mac') > -1) {
        special = {
            cmdorctrl:  '⌘',
            cmd:        '⌘',
            shift:      '⇧',
            alt:        '⌥',
            ctrl:       '⌃',
            tab:        '⇥',
            enter:      '↩',
            space:      '␣',
            escape:     '⎋',
            plus:       '+',
            minus:      '-',
            up:         '↑',
            down:       '↓',
            left:       '←',
            right:      '→',
        };
        separator = '';
    }
    var keys = accelerator.split('+');
    for (var i in keys) {
        var key = keys[i].toLowerCase();
        if (key in special) {
            keys[i] = special[key];
        }
    }
    return keys.join(separator);
};

var globalKeys = new GlobalKeys();

class MenuItem {
    constructor(data){
        this.type = data.type;
        if (data.type && data.type == 'separator') {
            return;
        }
        this.globalKeyObject = null;
        this.label = data.label;
        this.click = data.click;
        this.enabled = data.enabled;
        if (data.accelerator) {
            this.accelerator = data.accelerator;
        }
        if (data.submenu) {
            this.submenu = data.submenu;
        }
    }

    set accelerator(data) {
        if (this.globalKeyObject) {
            globalKeys.unbind(this.globalKeyObject);
        }
        this.globalKeyObject = globalKeys.add(data, (event) => {
            event.preventDefault();
            this.click(event);
        });
    }
}

module.exports = MenuItem;
