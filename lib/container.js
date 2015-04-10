/*jslint node:true, browser: true, esnext: true */
"use strict";

var _                   = require('lodash');
var textureManipulator  = require('./textureManipulator');
var worker              = require('./worker');

var itemFormatPlural = function(format) {
    if (format.toLowerCase() == 'texture')
        return 'textures';
    else if (format.toLowerCase() == 'directory')
        return 'directories';
    else
        return '';
};

class TreeItem {

    constructor(type, container){
        this.data           = {}; //This property should only ever be accessed by the get and set functions.
        this.type           = type;
        this.ele            = null;
        this.parent         = null;
        this.container      = container;
        this.directories    = [];
        this.textures       = [];
    }

    hasValidData(){
        if (this.type == 'texture') {
            if (Number.isInteger(this.getData('address')) &&
                Number.isInteger(this.getData('width')) &&
                Number.isInteger(this.getData('height')) &&
                this.getData('format').isValid()) {
                return true;
            }
        }
        return false;
    }

    setData(data, value) {
        if (data == 'format') {
            if (typeof value === "string")
                this.data[data] = textureManipulator.getFormat(value);
            else
                this.data[data] = value;
        } else {
            this.data[data] = value;
        }
        if (this.type == 'texture') {
            if (data == 'width' || data == 'height' || data == 'format') {
                this.updateData('size');
                this.updateData('start');
                this.updateData('end');
                this.updateIcon();
            } else if (data == 'address') {
                this.updateData('start');
                this.updateData('end');
                this.updateIcon();
            }
        } else if (this.type == 'directory') {
            if (data == 'address') {
                this.updateData('start');
                this.updateData('end');
            } else if (data == 'size') {
                this.updateData('end');
            }
        }
        this.updateData(data);
    }

    getBuffer() {
        return this.container.file.slice(this.getData('start'), this.getData('start')+this.getData('width')*this.getData('height')*this.getData('format').sizeModifier());
    }

    getPaletteBuffer() {
        return this.container.file.slice(this.parent.getData('start')+this.getData('palette'), this.parent.getData('start')+this.getData('palette')+0x200);
    }

    getTexture(callback) {
        if (this.type != 'texture' || !this.hasValidData()) {
            callback(null);
            return;
        }

        var textureFormat, image, palette;
        textureFormat = this.getData('format');
        if (textureFormat.hasPalette()) {
            palette = this.getPaletteBuffer();
        }
        //image = textureManipulator.generateTexture(this.getBuffer(), textureFormat, this.getData('width'));
        this.container.textureWorker.send({
            'type': 'generateTexture',
            'data': this.getBuffer(),
            'format': textureFormat.toString(),
            'width': this.getData('width'),
            'palette': palette
        }, function(out){
            if (out.img) {
                out.img.format = textureManipulator.getFormat(out.img.format.data.name); //Construct Format
                var image = new textureManipulator.TextureObject(out.img); //Construct TextureObject
                //console.log(image);
                callback(image);
            } else {
                callback(null);
            }
        });
    }

    updateIcon() {
        if (!this.ele) { //Skip if item does not have an element attached to it.
            return;
        }
        if (this.type == 'directory') {
            if ((this.directories && this.directories.length > 0) || (this.textures && this.textures.length > 0)) {
                this.ele.dataset['icon-0'] = 'assets/icons/folder_textures.png';
            } else {
                this.ele.dataset['icon-0'] = 'assets/icons/folder-empty.png';
            }
            return;
        }

        if (this.parent === null || !this.hasValidData()) {
            this.ele.dataset['icon-0'] = 'assets/icons/file.png';
            return;
        }
        if (!this.ele.dataset['icon-0']) {
            this.ele.dataset['icon-0'] = 'assets/icons/file.png';
        }

        this.getTexture((image) => {
            if (image) {
                image.toPNGBlob((blob) => {
                    if (this.blob) {
                        URL.revokeObjectURL(this.blob);
                    }
                    this.blob = URL.createObjectURL(blob);
                    this.ele.dataset['icon-0'] = this.blob;
                });
            } else {
                this.ele.dataset['icon-0'] = 'assets/icons/file.png';
            }
        });

    }

    getData(data){
        var address;
        if (this.type == 'texture') {
            if (data == 'size') {
                if (Number.isInteger(this.data.width) && Number.isInteger(this.data.height) && this.data.format.isValid()) {
                    return this.getData('width')*this.getData('height')*this.data.format.sizeModifier();
                } else {
                    return 0;
                }
            }
        }
        if (data == 'start') {
            address = this.data.address;
            this.getAncestors().forEach(function(ancestor, i){
                address += ancestor.data.address;
            });
            return address;
        } else if (data == 'end') {
            return this.getData('start')+this.getData('size');
        } else {
            return this.data[data];
        }
    }

    updateData(data){
        if (!this.ele) { //Skip if item does not have an element attached to it.
            return;
        }
        switch (data) {
            case "name":
                this.ele.dataset['col-0'] = this.getData(data);
                break;
            case "address":
                this.ele.dataset['col-1'] = '0x'+_.padLeft(this.getData(data).toString(16), 8, 0).toUpperCase();
                break;
            case "start":
                this.ele.dataset['col-2'] = '0x'+_.padLeft(this.getData(data).toString(16), 8, 0).toUpperCase();
                break;
            case "end":
                this.ele.dataset['col-3'] = '0x'+_.padLeft(this.getData(data).toString(16), 8, 0).toUpperCase();
                break;
            case "size":
                this.ele.dataset['col-4'] = '0x'+_.padLeft(this.getData(data).toString(16), 8, 0).toUpperCase();
                break;
            case "format":
                this.ele.dataset['col-5'] = this.getData(data).name;
                break;
            case "width":
                this.ele.dataset['col-6'] = this.getData(data);
                break;
            case "height":
                this.ele.dataset['col-7'] = this.getData(data);
                break;
            case "palette":
                if (this.getData('format').hasPalette()) {
                    this.ele.dataset['col-8'] = '0x'+_.padLeft(this.getData(data).toString(16), 8, 0).toUpperCase();
                } else {
                    this.ele.dataset['col-8'] = '';
                }
                break;
        }
    }

    setParent(newParent){
        if (newParent == this) {
            console.error('Attempted to set a tree item parent to itself');
            return;
        }
        if (this.parent) {
            if (this.parent === newParent) {
                return;
            } else {
                var arr = this.parent[itemFormatPlural(this.type)];
                arr.splice(arr.indexOf(this), 1);
            }
        }
        this.parent = newParent;
        newParent[itemFormatPlural(this.type)].push(this);
        if (this.ele && newParent.ele) { // Make sure that both this item and its parent has an element
            newParent.ele.appendChild(this.ele);
            this.updateDepth();
            this.updateData('start');
            this.updateData('end');
            this.updateIcon();
            newParent.updateIcon();
        }
    }

    getAncestors() {
        var ancestors = [],
            crnt = this.parent;
        while (crnt !== null) {
            ancestors.push(crnt);
            crnt = crnt.parent;
        }
        return ancestors;
    }

    updateDepth(){
        if (!this.ele) { //Skip if item does not have an element attached to it.
            return;
        }
        var crnt = this.parent,
            depth = 0;
        while (crnt !== null) {
            crnt = crnt.parent;
            depth++;
        }
        this.ele.dataset.depth = depth;
    }

    createElement() {
        this.ele = document.createElement('tree-item');
        this.ele.object = this;
    }

    getAllChildren(callback, directoriesFirst) {
        var types = ['directories', 'textures'];
        directoriesFirst = directoriesFirst || false;
        function _innerLoop(parent) {
            types.forEach(function(type){
                if (parent[type]) {
                    parent[type].forEach(function(item, index){
                        if (type == 'directories') {
                            if (!directoriesFirst) _innerLoop(item);
                            callback(item);
                            if (directoriesFirst) _innerLoop(item);
                        } else {
                            callback(item);
                        }
                    });
                }
            });
        }
        _innerLoop(this);
    }

    destroy() {
        this.getAllChildren(function(item){
            item.destroy();
            //console.log("destroying child");
        });
        if (this.blob) {
            URL.revokeObjectURL(this.blob);
        }
        this.ele.remove();
        if (this.container.root == this) {
            this.container.root = null;
            return;
        }
        var arr = this.parent[itemFormatPlural(this.type)];
        arr.splice(arr.indexOf(this), 1);
        this.parent.updateIcon();
    }

    toRaw() {
        var filtered = {};
        _.each(this.data, (value, key) => {
            if (key == 'palette' && (!this.getData('format').hasPalette() || isNaN(value))) {
                return;
            }
            if (key == 'size' && this.type == 'texture') {
                return;
            }
            filtered[key] = value;
        });

        var out = _.cloneDeep(filtered, (value, key) => {
            if (key == 'format') {
                return value.name;
            }
            if (key == 'address' || key == 'size' || key == 'palette') {
                return '0x'+_.padLeft(value.toString(16), 8, 0).toUpperCase();
            }
        });
        _.each(['directories', 'textures'], (type) => {
            if (this[type] && this[type].length) {
                out[type] = [];
                _.each(this[type], function(item){
                    out[type].push(item.toRaw());
                });
            }
        });
        return out;
    }
}



class Container {
    constructor() {
        this.file = null;
        this.root = null;
    }

    toString() {
        return this.root.toRaw();
    }

    sort(col, ascending, dir) {
        var colData = ['name', 'address', 'start', 'end', 'size', 'format', 'width', 'height', 'palette'];
        dir = dir || this.root;
        ['directories', 'textures'].forEach((type) => {
            if (!(dir[type] && dir[type].length)) {
                return;
            }
            var items = dir[type];
            items.sort((a, b) => {
                var da = a.getData(colData[col]) || '';
                var db = b.getData(colData[col]) || '';
                if (!ascending) {
                    var tmp = da;
                    da = db;
                    db = tmp;
                }
                return da.toString().localeCompare(db.toString());
            });
            items.forEach((item) => {
                if (dir.ele && item.ele) {
                    dir.ele.appendChild(item.ele);
                }
                if (item.type == 'directory') {
                    this.sort(col, ascending, item);
                }
            });
        });

    }

    initialize(input, noElements = false) {
        this.textureWorker = worker('textures');
        console.time('Initialize profile and tree');
        var root = this.root = new TreeItem('directory', this);
        if (!noElements)
            root.createElement();
        root.setData('name',    'Root');
        root.setData('address', 0x00000000);
        root.setData('size',    this.file.length);
        root.updateIcon();
        var types = ['directory', 'texture'];
        var _innerLoop = (input, parent) => {
            types.forEach((type) => {
                if (input[itemFormatPlural(type)]) {
                    input[itemFormatPlural(type)].forEach((i, index) => {
                        var item = new TreeItem(type, this);
                        if (!noElements)
                            item.createElement();
                        item.setData('name', i.data.name);
                        item.setData('address', parseInt(i.data.address, 16));
                        if (type == 'directory') {
                            item.setData('size', parseInt(i.data.size, 16));
                            item.setParent(parent);
                            _innerLoop(i, item);
                        } else {
                            item.setData('format', i.data.format);
                            item.setData('width', parseInt(i.data.width));
                            item.setData('height', parseInt(i.data.height));
                            item.setData('palette', parseInt(i.data.palette));
                            item.setParent(parent);
                        }
                    });
                }
            });
        };
        if (input) {
            _innerLoop(input, root);
        }
        console.log(this);
        console.timeEnd('Initialize profile and tree');
    }

    newItem(type) {
        return new TreeItem(type, this);
    }
}

module.exports = new Container();
