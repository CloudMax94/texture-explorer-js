/*jslint node:true, browser: true */
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
}

var createField = function(field) {
    var d = new Date();
    var n = d.getTime();
    var label  = document.createElement('label');
    label.innerHTML = _.capitalize(field.name)+':';
    label.setAttribute('for', n+'-'+field.name);

    var input  = document.createElement('input');
    input.id = n+'-'+field.name;
    input.name = field.name;
    if (field.type == 'hex') {
        field.type = 'text';
        input.classList.add('hex-input');
        input.onkeydown = function() {
            var val = parseInt(event.target.value);
            console.log(event);
            if (isNaN(val))
                val = 0;
            var modifier = 0x01;
            if (event.shiftKey)
                modifier = 0x10;
            switch (event.keyCode) {
                case 33: //Page Up
                    event.preventDefault();
                    val += modifier*0x10;
                    event.target.value = '0x'+_.padLeft(val.toString(16), 8, 0).toUpperCase();
                    event.target.dispatchEvent(new Event('input'));
                    break;
                case 34: //Page Down
                    event.preventDefault();
                    val -= modifier*0x10;
                    val = Math.max(0, val);
                    event.target.value = '0x'+_.padLeft(val.toString(16), 8, 0).toUpperCase();
                    event.target.dispatchEvent(new Event('input'));
                    break;
                case 38: //up
                    event.preventDefault();
                    val += modifier;
                    event.target.value = '0x'+_.padLeft(val.toString(16), 8, 0).toUpperCase();
                    input.oninput();
                    break;
                case 40: //down
                    event.preventDefault();
                    val -= modifier;
                    val = Math.max(0, val);
                    event.target.value = '0x'+_.padLeft(val.toString(16), 8, 0).toUpperCase();
                    input.oninput();
                    break;
            }
        };
    }
    input.type = field.type;

    return {
        label: label,
        input: input
    }
}

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
}

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
    var move = function(e) {
        console.log("resize");
        var prev = self.previousElementSibling;
        var next = self.nextElementSibling;
        var direction = window.getComputedStyle(self.parentElement).getPropertyValue('flex-direction');
        if (direction == 'row') { //horizontal
            var width = e.clientX-self.parentElement.offsetLeft;
            prev.style.flexBasis = width+'px';
            next.style.flexBasis = document.body.offsetWidth-width+'px';
        } else { //vertical
            var height = e.clientY-self.parentElement.offsetTop;
            prev.style.flexBasis = height+'px';
            next.style.flexBasis = document.body.offsetHeight-height+'px';
        }
    };
    var handle = document.createElement('div');
    handle.classList.add('handle');
    handle.addEventListener('mousedown', function(e) {
        window.addEventListener('mousemove', move, false);
    });
    window.addEventListener('mouseup', function(e) {
        window.removeEventListener('mousemove', move, false);
    });
    root.appendChild(handle);
};
document.registerElement('ui-handle', {
    prototype: uiHandleProto
});

module.exports = {
    createDataList: createDataList,
    createForm: createForm
};