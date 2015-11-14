"use strict";

var React       = require('react/addons');
var Reflux      = require('reflux');
var actions     = require('../actions/workspace');
var _           = require('lodash');
var Immutable   = require('immutable');
var worker      = require('../lib/worker');
var fileHandler = require('../lib/fileHandler');
var path        = require('path');

var itemFormatPlural = function(format) {
    if (format.toLowerCase() == 'texture')
        return 'textures';
    else if (format.toLowerCase() == 'directory')
        return 'directories';
    else
        return '';
};

var DirectoryRecord = Immutable.Record({
    id:             null,
    parentId:       null,
    name:           'New Directory',
    address:        0,
    length:         0,
    type:           'directory',
});

var TextureRecord = Immutable.Record({
    id:             null,
    parentId:       null,
    name:           'New Texture',
    address:        0,
    format:         'rgba32',
    width:          32,
    height:         32,
    palette:        0,
    type:           'texture',
});

var WorkspaceRecord = Immutable.Record({
    id:                 null,
    data:               null,
    path:               null,
    name:               'New Workspace',
    key:                null,
    items:              null,
    root:               null,
    selectedDirectory:  null,
    selectedTexture:    null,
});

var workspaces = Immutable.Map();
var currentWorkspace = null;

function prepareProfile(profile, length) {
    console.time('Initialize profile and tree');
    var types = ['directory', 'texture'];
    var _innerLoop = (input, items, parent) => {
        types.forEach((type) => {
            if (input[itemFormatPlural(type)]) {
                input[itemFormatPlural(type)].forEach((i, index) => {
                    var item;
                    var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
                    if (type == 'directory') {
                        item = new DirectoryRecord({
                            id :        id,
                            parentId :  parent,
                            name:       i.data.name,
                            address:    parseInt(i.data.address, 16),
                            length:     parseInt(i.data.size, 16),
                        });
                        items = _innerLoop(i, items, id);
                    } else {
                        item = new TextureRecord({
                            id :        id,
                            parentId :  parent,
                            name:       i.data.name,
                            address:    parseInt(i.data.address, 16),
                            format:     i.data.format,
                            width:      parseInt(i.data.width),
                            height:     parseInt(i.data.height),
                            palette:    parseInt(i.data.palette, 16),
                        });
                    }

                    items = items.set(id, item);
                });
            }
        });
        return items;
    };
    var id = 'root';
    var rootItem = new DirectoryRecord({
        id:         id,
        name:       'Root',
        address:    0,
        absolute:   0,
        length:     length,
    });
    var items = Immutable.Map();
    items = items.set(id, rootItem);
    if (profile) {
        items = _innerLoop(profile, items, id);
    }
    console.log(items);
    console.timeEnd('Initialize profile and tree');
    return items;
}

class Workspace {
    constructor(data, info) {
        this.data = data;
        this.path = info.path;
        this.name = info.name;
        this.id = info.id;
        this.root = null;
        this.selectedDirectory = null;
        this.selectedTexture = null;
    }
}

var store = Reflux.createStore({
    onSetCurrentDirectory(item){
        workspaces = workspaces.setIn([currentWorkspace, 'selectedDirectory'], item);
        this.trigger();
    },
    onSetCurrentTexture(item){
        workspaces = workspaces.setIn([currentWorkspace, 'selectedTexture'], item);
        this.trigger();
    },
    onSetCurrentWorkspace(workspace){
        currentWorkspace = workspace.id;
        this.trigger();
    },
    onCreateWorkspace(input){
        console.log('onCreateWorkspace');
        var data = input.data;
        var filePath = input.path;
        var name = input.name;
        var key = data.toString('utf8', 0x3B, 0x3F)+data.readUInt8(0x3F);
        var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);

        var workspace = new WorkspaceRecord({
            id:                 id,
            data:               data,
            path:               filePath,
            name:               name,
            key:                key,
            items:              null,
            root:               null,
            selectedDirectory:  null,
            selectedTexture:    null,
        });

        fileHandler.loadProfile(path.join(__dirname, '../', '/profiles/'+key+'/default/fileList.json'), (profile) => {
            var items = prepareProfile(profile);
            workspace = workspace.merge({
                items:              items,
                root:               items.get('root'),
                selectedDirectory:  items.get('root'),
            });
            workspaces = workspaces.set(id, workspace);
            currentWorkspace = id;
            this.trigger();
        });
    },
    init(){
        this.listenTo(actions.setCurrentDirectory, this.onSetCurrentDirectory);
        this.listenTo(actions.setCurrentTexture, this.onSetCurrentTexture);
        this.listenTo(actions.setCurrentWorkspace, this.onSetCurrentWorkspace);
        this.listenTo(actions.createWorkspace, this.onCreateWorkspace);
    },
    getWorkspaces(){
        return workspaces;
    },
    getCurrentWorkspace(){
        return workspaces.get(currentWorkspace);
    },
    getItemAbsoluteAddress(item){
        var address = item.get('address');
        var items = this.getCurrentWorkspace().get('items');
        while (item.get('parentId') && item.get('parentId') !== 'root') {
            item = items.get(item.get('parentId'));
            address += item.get('address');
        }
        return address;
    }
});

module.exports = store;
