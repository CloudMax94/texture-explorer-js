/*jslint node:true, browser: true, esnext: true */
var _                   = require('lodash');
var textureManipulator  = require('./textureManipulator');

var textureViewerProto = Object.create(HTMLElement.prototype);
textureViewerProto.createdCallback = function() {
    var root = this.createShadowRoot();
    var wrap = document.createElement('div');
    wrap.classList.add('wrap');
    var image = document.createElement('img');
    image.onclick = () => {
        if (this.dataset.bg === "1") {
            this.dataset.bg = 0;
        } else {
            this.dataset.bg = 1;
        }
    };
    wrap.appendChild(image);
    root.appendChild(wrap);
    this.img = image;
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

module.exports = class TextureViewer {
    constructor(workspace, ele) {
        this.generateTexture = _.throttle(this.generateTexture, 50);
        this.url = null;
        this.workspace = workspace;
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
        return;
        this.inputs = {};
        _.each(['name', 'format', 'offset', 'address', 'width', 'height', 'palette'], (name) => {
            var input = parent.querySelector('[name="'+name+'"]');
            this.inputs[name] = input;
            input.oninput = () => {
                this[name] = input.value;
            };
        });
    }

    generateTexture() {
        if (this.lock) return;
        if (!(this.address > -1 && this.width > 0 && this.height > 0))
            return;
        var textureFormat = this.format;
        if (!textureFormat.isValid())
            return;
        var palette = null;
        if (textureFormat.hasPalette()) {
            if (this.palette < 1)
                return;
            palette = this.workspace.file.slice(this.palette, this.palette+0x200);
        }
        this.lock = true;
        var imgBuffer = this.workspace.file.slice(this.address, this.address+this.width*this.height*textureFormat.sizeModifier());
        var image = textureManipulator.generateTexture(imgBuffer, textureFormat, this.width, palette);
        if (image) {
            this.textureObject = image;
            image.toPNGBlob((blob) => {
                if (this.url) {
                    URL.revokeObjectURL(this.url);
                }
                this.url = URL.createObjectURL(blob);
                this.ele.dataset.src = this.url;
            });
        } else {
            this.textureObject = null;
            this.ele.dataset.src = '';
        }
        _.defer(() => {
            this.lock = false;
        });

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
                this.inputs.palette.classList.remove('hidden');
                document.querySelector('label[for="'+this.inputs.palette.id+'"]').classList.remove('hidden');
            } else {
                this.inputs.palette.classList.add('hidden');
                document.querySelector('label[for="'+this.inputs.palette.id+'"]').classList.add('hidden');
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
