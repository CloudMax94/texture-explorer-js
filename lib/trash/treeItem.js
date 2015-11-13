/*jslint node:true, browser: true, esnext: true */
"use strict";

var _                   = require('lodash');
var textureManipulator  = require('./textureManipulator');

var workspaceStore      = require('../stores/workspace');

var itemFormatPlural = function(format) {
    if (format.toLowerCase() == 'texture')
        return 'textures';
    else if (format.toLowerCase() == 'directory')
        return 'directories';
    else
        return '';
};

var uniqueID = 0;

class TreeItem {

    constructor(type, workspace){
        this.data           = {}; //This property should only ever be accessed by the get and set functions.
        this.type           = type;
        this.parent         = null;
        this.workspace      = workspace;
        this.directories    = [];
        this.textures       = [];
        this.id             = uniqueID++;
        this.blob           = null;
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
            if (data == 'width' || data == 'height' || data == 'format' || data == 'address') {
            }
        }
        //update t ree
    }

    getBuffer() {
        return this.workspace.data.slice(this.getData('start'), this.getData('start')+this.getData('width')*this.getData('height')*this.getData('format').sizeModifier());
    }

    getPaletteBuffer() {
        if (this.parent) {
            return this.workspace.data.slice(this.parent.getData('start')+this.getData('palette'), this.parent.getData('start')+this.getData('palette')+0x200);
        } else {
            return null;
        }
    }

    updateBlob() {
        this.getTexture((image) => {
            if (image) {
                image.toPNGBlob((blob) => {
                    if (this.blob) {
                        URL.revokeObjectURL(this.blob);
                    }
                    this.blob = URL.createObjectURL(blob);
                    workspaceStore.trigger();
                });
            }
        });
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
        this.workspace.textureWorker.send({
            'type': 'generateTexture',
            'data': this.getBuffer(),
            'format': textureFormat.toString(),
            'width': this.getData('width'),
            'palette': palette
        }, function(out){
            if (out.img) {
                out.img.format = textureManipulator.getFormat(out.img.format.data.name); //Construct Format
                var image = new textureManipulator.TextureObject(out.img); //Construct TextureObject
                callback(image);
            } else {
                callback(null);
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
        var arr = this.parent[itemFormatPlural(this.type)];
        arr.splice(arr.indexOf(this), 1);
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

module.exports = TreeItem;
