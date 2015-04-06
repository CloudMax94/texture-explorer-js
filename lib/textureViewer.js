/*jslint node:true, browser: true, esnext: true */
var _                   = require('lodash');
var textureManipulator  = require('./textureManipulator');

module.exports = class TextureViewer {
    constructor(container, ele) {
        var self = this;
        this.generateTexture = _.throttle(this.generateTexture, 50);
        this.url = null;
        this.container = container;
        this.data = {
            format:     null,
            address:    null,
            width:      null,
            height:     null,
            palette:    null
        };
        this.start = 0;
        this.ele = ele;
    }

    assignInputs(parent) {
        var self = this;
        self.inputs = {};
        _.each(['name', 'format', 'offset', 'address', 'width', 'height', 'palette'], function(name){
            var input = parent.querySelector('[name="'+name+'"]');
            self.inputs[name] = input;
            input.oninput = function() {
                self[name] = input.value;
            };
        });
    }

    generateTexture() {
        if (this.lock) return;
        var self = this;
        if (!(this.address > -1 && this.width > 0 && this.height > 0))
            return;
        var textureFormat = this.format;
        if (!textureFormat.isValid())
            return;
        var palette = null;
        if (textureFormat.hasPalette()) {
            if (this.palette < 1)
                return;
            palette = new DataView(this.container.file, this.palette, 0x200);
        }
        self.lock = true;
        var imgBuffer = new DataView(this.container.file, this.address, this.width*this.height*textureFormat.sizeModifier());
        var image = textureManipulator.generateTexture(imgBuffer, textureFormat, this.width, palette);
        if (image) {
            self.textureObject = image;
            image.toPNGBlob(function(blob){
                if (self.url) {
                    URL.revokeObjectURL(self.url);
                }
                self.url = URL.createObjectURL(blob);
                self.ele.dataset.src = self.url;
            });
        } else {
            self.textureObject = null;
            self.ele.dataset.src = '';
        }
        _.defer(function(){
            self.lock = false;
        })

    }

    get name() {
        return this.data.name;
    }

    get format() {
        return this.data.format;
    }

    get address() {
        return this.data.offset + this.start;
    }

    get width() {
        return this.data.width;
    }

    get height() {
        return this.data.height;
    }

    get palette() {
        return this.data.palette;
    }

    get texture() {
        return this.textureObject;
    }

    set texture(item) {
        if (item.type == 'texture') {
            this.lock = true;
            this.item       = item;
            this.start      = item.parent.getData('start');
            this.name       = item.getData('name');
            this.format     = item.getData('format');
            this.offset     = item.getData('address');
            this.width      = item.getData('width');
            this.height     = item.getData('height');
            if (this.format.hasPalette()) {
                this.palette = item.getData('start')+item.getData('palette');
            } else {
                this.palette = 0;
            }
            this.lock = false;
            this.generateTexture();
        }
    }

    set name(data) {
        this.data.name = data;
        if (this.inputs) {
            this.inputs.name.value = data;
        }
    }

    set format(data) {
        if (typeof data === 'string') {
            data = textureManipulator.getFormat(data);
        }
        this.data.format = data;
        if (this.inputs) {
            this.inputs.format.value = data.name;
            if (this.format.hasPalette()) {
                this.inputs.palette.style.display = '';
                this.inputs.palette.labels[0].style.display = '';
            } else {
                this.inputs.palette.style.display = 'none';
                this.inputs.palette.labels[0].style.display = 'none';
            }
            if (this.format == textureManipulator.getFormat('jpeg')) {

            }
        }
        this.generateTexture();
    }

    set offset(data) {
        if (!Number.isInteger(data) && data.indexOf('0x') === 0) {
            data = parseInt(data);
        }
        this.data.offset = data;
        if (this.inputs) {
            this.inputs.offset.value = '0x'+_.padLeft(data.toString(16), 8, 0).toUpperCase();
            this.inputs.address.value = '0x'+_.padLeft((this.address).toString(16), 8, 0).toUpperCase();
        }
        this.generateTexture();
    }

    set address(data) {
        if (!Number.isInteger(data) && data.indexOf('0x') === 0) {
            data = parseInt(data);
        }
        this.offset = data-this.start;
    }

    set width(data) {
        this.data.width = data;
        if (this.inputs)
            this.inputs.width.value = data;
        this.generateTexture();
    }

    set height(data) {
        this.data.height = data;
        if (this.inputs)
            this.inputs.height.value = data;
        this.generateTexture();
    }

    set palette(data) {
        if (!Number.isInteger(data) && data.indexOf('0x') === 0) {
            data = parseInt(data);
        }
        this.data.palette = data;
        if (this.inputs)
            this.inputs.palette.value = '0x'+_.padLeft(data.toString(16), 8, 0).toUpperCase();
        this.generateTexture();
    }
};

var textureViewerProto = Object.create(HTMLElement.prototype);
textureViewerProto.createdCallback = function() {
    var self = this;
    var root = this.createShadowRoot();
    var wrap = document.createElement('div');
    wrap.classList.add('wrap');
    var image = document.createElement('img');
    image.onclick = function() {
        if (self.dataset.bg === "1") {
            self.dataset.bg = 0;
        } else {
            self.dataset.bg = 1;
        }
    };
    wrap.appendChild(image);
    root.appendChild(wrap);
    self.img = image;
};
textureViewerProto.attributeChangedCallback = function(attrName, oldValue, newValue) {
    if (attrName.indexOf('data-') !== 0)
        return;
    var data = attrName.substr(5);
    if (data === 'src') {
        this.img.src = newValue;
    } else if (data === 'bg') {
        if (newValue === "0") {
            this.img.style.background = '';
        } else {
            this.img.style.background = 'rgb(255, 0, 255)';
        }
    }
};
document.registerElement('texture-viewer', {
    prototype: textureViewerProto
});