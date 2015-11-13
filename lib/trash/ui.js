/*jslint node:true, browser: true, esnext: true */
"use strict";

var _ = require('lodash');

var createField = function(field) {
    var d = new Date();
    var n = d.getTime();
    var label  = document.createElement('label');
    label.innerHTML = _.capitalize(field.name)+':';
    label.setAttribute('for', n+'-'+field.name);

    var input  = document.createElement('input');
    input.id = n+'-'+field.name;
    for (var key in field) {
        input.setAttribute(key, field[key]);
    }
    if (field.type == 'hex') {
        input.type = 'text';
        input.classList.add('hex-input');

        var do_down = function(modifier = 1) {
            var val = parseInt(input.value);
            if (isNaN(val))
                val = 0;
            val -= modifier;
            val = Math.max(0, val);
            input.value = '0x'+_.padLeft(val.toString(16), 8, 0).toUpperCase();
            input.oninput();
        };

        var do_up = function(modifier = 1) {
            var val = parseInt(input.value);
            if (isNaN(val))
                val = 0;
            val += modifier;
            input.value = '0x'+_.padLeft(val.toString(16), 8, 0).toUpperCase();
            input.oninput();
        };

        input.onkeydown = function(event) {
            var val = parseInt(input.value);
            if (isNaN(val))
                val = 0;
            var modifier = 0x01;
            if (event.shiftKey)
                modifier = 0x10;
            switch (event.keyCode) {
                case 33: //Page Up
                    event.preventDefault();
                    do_up(modifier*0x10);
                    input.dispatchEvent(new Event('input'));
                    break;
                case 34: //Page Down
                    event.preventDefault();
                    do_down(modifier*0x10);
                    input.dispatchEvent(new Event('input'));
                    break;
                case 38: //up
                    event.preventDefault();
                    do_up(modifier);
                    break;
                case 40: //down
                    event.preventDefault();
                    do_down(modifier);
                    break;
            }
        };

        var hexSpinner = document.createElement('div');
        hexSpinner.classList.add('hex-spinner');

        hexSpinner.onmousedown = function(event) {
            if (event.which != 1)
                return true;
            event.preventDefault();
            var height = event.target.offsetHeight;
            input.focus();
            console.log(event);
            if (event.layerY >= 18/2) {
                input.interval = setInterval(do_down, 50);
                do_down();
                input.dispatchEvent(new Event('input'));
            } else {
                input.interval = setInterval(do_up, 50);
                do_up();
                input.dispatchEvent(new Event('input'));
            }
        };

        document.addEventListener("mouseup", function(event) {
            clearInterval(input.interval);
        });

        var hexWrap = document.createElement('div');
        hexWrap.classList.add('hex-wrap');
        hexWrap.appendChild(input);
        hexWrap.appendChild(hexSpinner);
        return {
            label: label,
            input: hexWrap
        };
    } else {
        return {
            label: label,
            input: input
        };
    }
};

var createForm = function(fields) {
    var wrap = document.createElement('div');
    wrap.classList.add('input-columns');
    var labels = document.createElement('div');
    labels.style.flex = '0 1 auto';
    var inputs = document.createElement('div');
    inputs.style.flex = '1 0';
    _.each(fields, function(field){
        var f = createField(field);
        labels.appendChild(f.label);
        inputs.appendChild(f.input);
    });
    wrap.appendChild(labels);
    wrap.appendChild(inputs);
    return wrap;
};

var contextMenuProto = Object.create(HTMLElement.prototype);
contextMenuProto.attachedCallback = function() {
    this.closeMenu = (event) => {
        var parentEle = null;
        if (event) {
            parentEle = event.target;
        }
        while (parentEle !== null && parentEle.tagName != 'CONTEXT-MENU') {
            parentEle = parentEle.parentNode;
        }
        if (!parentEle) {
            this.remove();
        }
    };
    window.addEventListener('mouseup', this.closeMenu, false);
};
contextMenuProto.detachedCallback = function() {
    window.removeEventListener('mouseup', this.closeMenu, false);
};
document.registerElement('context-menu', {
    prototype: contextMenuProto
});

module.exports = {
    createForm
};
