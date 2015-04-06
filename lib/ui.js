/*jslint node:true, browser: true, esnext: true */
"use strict";

var _ = require('lodash');

var createDataList = function(id, options) {
    var list = document.createElement('datalist');
    list.id = id;
    _.each(options, function(val){
        var option = document.createElement('option');
        option.value = val;
        option.text = val;
        list.appendChild(option);
    });
    document.body.insertBefore(list, document.body.firstChild);
};

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
            if (event.offsetY >= 10) {
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

var uiPanelProto = Object.create(HTMLElement.prototype);
uiPanelProto.createdCallback = function() {
    var self = this;
    if (this.dataset.size) {
        this.style.flex = '0 0 '+this.dataset.size;
    }
};
document.registerElement('ui-panel', {
    prototype: uiPanelProto
});

var uiContainerProto = Object.create(HTMLElement.prototype);
uiContainerProto.createdCallback = function() {
    var self = this;
    var root = this.createShadowRoot();
    var fieldset = document.createElement('fieldset');
    var legend = document.createElement('legend');
    var content = document.createElement('content');
    legend.innerHTML = this.dataset.title;
    fieldset.appendChild(legend);
    fieldset.appendChild(content);
    root.appendChild(fieldset);
    if (this.dataset.size) {
        this.style.flex = '0 0 '+this.dataset.size;
    }
};
document.registerElement('ui-container', {
    prototype: uiContainerProto
});

var uiHandleProto = Object.create(HTMLElement.prototype);
uiHandleProto.createdCallback = function() {
    var self = this;
    var root = this.createShadowRoot();
    var move = function(event) {
        console.log("resize");
        var prev = self.previousElementSibling;
        var next = self.nextElementSibling;
        var direction = window.getComputedStyle(self.parentElement).getPropertyValue('flex-direction');
        if (direction == 'row') { //horizontal
            var width = event.clientX-self.parentElement.offsetLeft;
            prev.style.flexBasis = width+'px';
            next.style.flexBasis = document.body.offsetWidth-width+'px';
        } else { //vertical
            var height = event.clientY-self.parentElement.offsetTop;
            prev.style.flexBasis = height+'px';
            next.style.flexBasis = document.body.offsetHeight-height+'px';
        }
    };
    var handle = document.createElement('div');
    handle.classList.add('handle');
    handle.addEventListener('mousedown', function(event) {
        window.addEventListener('mousemove', move, false);
    });
    window.addEventListener('mouseup', function(event) {
        window.removeEventListener('mousemove', move, false);
    });
    root.appendChild(handle);
};
document.registerElement('ui-handle', {
    prototype: uiHandleProto
});

var contextMenuProto = Object.create(HTMLElement.prototype);
contextMenuProto.attachedCallback = function() {
    var self = this;
    this.closeMenu = function(event) {
        var parentEle = null;
        if (event) {
            parentEle = event.target;
        }
        while (parentEle !== null && parentEle.tagName != 'CONTEXT-MENU') {
            parentEle = parentEle.parentNode;
        }
        if (!parentEle) {
            self.remove();
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
    createDataList: createDataList,
    createForm: createForm
};