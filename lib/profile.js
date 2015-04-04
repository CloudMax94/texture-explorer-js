/*jslint node:true, browser: true, esnext: true */
"use strict";

var _                   = require('lodash');
var textureManipulator  = require('./textureManipulator');

class TreeItem {

    constructor(type, container, item){
        this.data = { //This property should only ever be accessed by the get and set functions.
            name:       null,
            address:    null,
            size:       null
        };

        this.type           = type;
        this.ele            = null;
        this.parent         = null;
        this.container      = container;
        this.directories    = [];
        this.textures       = [];
        if (item) {
            if (item.directories)
                this.directories = item.directories;
            if (item.textures)
                this.textures = item.textures;
        }
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

    getArrayBuffer() {
        var buf = this.container.file.slice(this.getData('start'), this.getData('start')+this.getData('width')*this.getData('height')*this.getData('format').sizeModifier());
        return buf;
    }

    getTexture(callback) {
        if (this.type != 'texture' || !this.hasValidData()) {
            callback(null);
            return;
        }

        var textureFormat, imgBuffer, image, palette;
        textureFormat = this.getData('format');
        imgBuffer = new DataView(this.getArrayBuffer());
        if (textureFormat.hasPalette()) {
            palette = new DataView(this.container.file, this.parent.getData('start')+this.getData('palette'), 0x200);
            image = textureManipulator.generateTexture(imgBuffer, textureFormat, this.getData('width'), palette);
        } else {
            image = textureManipulator.generateTexture(imgBuffer, textureFormat, this.getData('width'));
        }
        if (image) {
            callback(image);
        } else {
            callback(null);
        }
    }

    updateIcon() {
        var self = this;
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

        self.getTexture(function(image){
            if (image) {
                image.toPNGBlob(function(blob){
                    if (self.blob) {
                        URL.revokeObjectURL(self.blob);
                    }
                    self.blob = URL.createObjectURL(blob);
                    self.ele.dataset['icon-0'] = self.blob;
                });
            } else {
                self.ele.dataset['icon-0'] = 'assets/icons/file.png';
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

    setParent(parent){
        if (parent == this) {
            console.error('Attempted to set a tree item parent to itself');
            return;
        }
        this.parent = parent;
        if (this.ele && parent.ele) { // Make sure that both this item and its parent has an element
            parent.ele.appendChild(this.ele);
            this.updateDepth();
            this.updateData('start');
            this.updateData('end');
            this.updateIcon();
            parent.updateIcon();
        } else {
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
        if (this.type == 'texture') {
            this.parent.textures.splice(this.parent.textures.indexOf(this), 1);
        } else {
            this.parent.directories.splice(this.parent.directories.indexOf(this), 1);
        }
    }

    toRaw() {
        var self = this;

        var filtered = {};
        _.each(this.data, function(value, key){
            if (key == 'palette' && (!self.getData('format').hasPalette() || isNaN(value))) {
                return;
            }
            if (key == 'size' && self.type == 'texture') {
                return;
            }
            filtered[key] = value;
        });

        var out = _.cloneDeep(filtered, function(value, key){
            if (key == 'format') {
                return value.name;
            }
            if (key == 'address' || key == 'size' || key == 'palette') {
                return '0x'+_.padLeft(value.toString(16), 8, 0).toUpperCase();
            }
        });
        _.each(['directories', 'textures'], function(type){
            if (self[type] && self[type].length) {
                out[type] = [];
                _.each(self[type], function(item){
                    out[type].push(item.toRaw());
                });
            }
        });
        return out;
    }
}

var initialize = function(container) {
    console.time('Initialize data');
    //var TreeItem = new TreeItem(container);
    var root = container.root = new TreeItem('directory', container, container.root);
    root.createElement();
    root.setData('name',    'Root');
    root.setData('address', 0x00000000);
    root.setData('size',    container.file.byteLength);
    root.updateIcon();
    var types = {'directories': 'directory', 'textures': 'texture'};
    function _innerLoop(parent) {
        _.each(types, function(typeName, type) {
            parent[type].forEach(function(i, index){
                var item = new TreeItem(typeName, container, i);
                parent[type][index] = item;
                item.createElement();
                item.setData('name', i.data.name);
                item.setData('address', parseInt(i.data.address, 16));
                if (type == 'directories') {
                    item.setData('size', parseInt(i.data.size, 16));
                    item.setParent(parent);
                    _innerLoop(item);
                } else {
                    item.setData('format', i.data.format);
                    item.setData('width', parseInt(i.data.width));
                    item.setData('height', parseInt(i.data.height));
                    item.setData('palette', parseInt(i.data.palette));
                    item.setParent(parent);
                }
            });
        });
    }
    _innerLoop(root);

    console.log(container);

    console.timeEnd('Initialize data');
};

var colData = ['name', 'address', 'start', 'end', 'size', 'format', 'width', 'height', 'palette'];
var createProfile = function() {
    return {
        file: null,
        root: null,
        stringify: function() {
            console.log(this.root.toRaw());
            /*
            return JSON.stringify(this.root, function(key, value) {
                if (key == 'data') {
                    console.log(value);
                }
                if (key == 'type' ||
                    key == 'parent' ||
                    key == 'ele' ||
                    key == 'container' ||
                    key == 'file' ||
                    value === null ||
                    (Array.isArray(value) && !value.length) ||
                    (key == 'palette' && isNaN(value))
                )
                    return;
                if (key == 'address' || key == 'size' || key == 'palette') {
                    return '0x'+_.padLeft(value.toString(16), 8, 0).toUpperCase();
                }
                if (key == 'format') {
                    return value.name;
                }
                return value;
            }, 4);
*/
        },
        sort: function(col, ascending, dir) {
            var self = this;
            dir = dir || this.root;
            ['directories', 'textures'].forEach(function(type){
                if (!(dir[type] && dir[type].length)) {
                    return;
                }
                var items = dir[type];
                items.sort(function(a, b) {
                    var da = a.getData(colData[col]) || '';
                    var db = b.getData(colData[col]) || '';
                    if (!ascending) {
                        var tmp = da;
                        da = db;
                        db = tmp;
                    }
                    return da.toString().localeCompare(db.toString());
                });
                items.forEach(function(item){
                    if (dir.ele && item.ele) {
                        dir.ele.appendChild(item.ele);
                    }
                    if (item.type == 'directory') {
                        self.sort(col, ascending, item);
                    }
                });
            });

        }
    };
};

module.exports = {
    new:        createProfile,
    initialize: initialize
};