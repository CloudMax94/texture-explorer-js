const Reflux      = require('reflux');
const actions     = require('../actions/workspace');
const Immutable   = require('immutable');
const worker      = require('../lib/worker');
const fileHandler = require('../lib/fileHandler');
const path        = require('path');
const textureManipulator = require('../lib/textureManipulator');

function itemFormatPlural(format) {
    if (format.toLowerCase() === 'texture') {
        return 'textures';
    } else if (format.toLowerCase() === 'directory') {
        return 'directories';
    }
    return '';
}

const DirectoryRecord = Immutable.Record({
    id:             null,
    parentId:       null,
    name:           'New Directory',
    address:        0,
    length:         0,
    type:           'directory',
});

const TextureRecord = Immutable.Record({
    id:             null,
    parentId:       null,
    name:           'New Texture',
    address:        0,
    format:         'rgba32',
    width:          32,
    height:         32,
    palette:        0,
    type:           'texture',
    blob:           null,
    blobStamp:      0,
});

const WorkspaceRecord = Immutable.Record({
    id:                 null,
    data:               null,
    path:               null,
    name:               'New Workspace',
    key:                null,
    items:              null,
    selectedDirectory:  null,
    selectedTexture:    null,
});

let idCounter = 0;

const textureWorker = worker('textures');
let workspaces = Immutable.Map();
let currentWorkspace = null;

function prepareProfile(profile, length) {
    console.time('Initialize profile and tree');
    const types = ['directory', 'texture'];
    const _innerLoop = (input, items, parent) => {
        types.forEach((type) => {
            if (input[itemFormatPlural(type)]) {
                input[itemFormatPlural(type)].forEach((i, index) => {
                    let item;
                    const id = (idCounter++).toString(36);
                    if (type === 'directory') {
                        item = new DirectoryRecord({
                            id:         id,
                            parentId:   parent,
                            name:       i.data.name,
                            address:    parseInt(i.data.address, 16),
                            length:     parseInt(i.data.size, 16),
                        });
                        items = _innerLoop(i, items, id);
                    } else {
                        item = new TextureRecord({
                            id:         id,
                            parentId:   parent,
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
    const id = 'root';
    const rootItem = new DirectoryRecord({
        id:         id,
        name:       'Root',
        address:    0,
        absolute:   0,
        length:     length,
    });
    let items = Immutable.Map();
    items = items.set(id, rootItem);
    if (profile) {
        items = _innerLoop(profile, items, id);
    }
    console.timeEnd('Initialize profile and tree');
    return items;
}

function sortItems() {
    const itemPath = [currentWorkspace, 'items'];
    const items = workspaces.getIn(itemPath).sort((a, b) => {
        let res = 0;
        if (a.get('type') === 'directory') res -= 2;
        if (b.get('type') === 'directory') res += 2;
        return res + (a.get('address') > b.get('address') ? 1 : (b.get('address') > a.get('address') ? -1 : 0));
    });
    workspaces = workspaces.setIn(itemPath, items);
}

function getItemBuffer(item) {
    return workspaces.getIn([currentWorkspace, 'data']).slice(
        item.get('address'),
        item.get('address')+item.get('width')*item.get('height')*textureManipulator.getFormat(item.get('format')).sizeModifier()
    );
}

function getItemPaletteBuffer(item) {
    const parentId = item.get('parentId');
    const parent = workspaces.getIn([currentWorkspace, 'items', parentId]);
    if (parent) {
        return workspaces.getIn([currentWorkspace, 'data']).slice(
            parent.get('address')+item.get('palette'),
            parent.get('address')+item.get('palette')+0x200
        );
    }
    return null;
}

function itemHasValidData(item) {
    if (item.get('type') === 'texture') {
        if (Number.isInteger(item.get('address')) &&
            Number.isInteger(item.get('width')) &&
            Number.isInteger(item.get('height')) &&
            textureManipulator.getFormat(item.get('format')).isValid()) {
            return true;
        }
    }
    return false;
}

function getItemTexture(item, callback) {
    if (item.get('type') !== 'texture' || !itemHasValidData(item)) {
        callback(null);
        return;
    }

    let palette;
    const textureFormat = textureManipulator.getFormat(item.get('format'));
    if (textureFormat.hasPalette()) {
        palette = getItemPaletteBuffer(item);
    }
    textureWorker.send({
        type: 'generateTexture',
        data: getItemBuffer(item),
        format: textureFormat.toString(),
        width: item.get('width'),
        palette: palette,
    }, function(out) {
        if (out.img) {
            out.img.format = textureManipulator.getFormat(out.img.format.data.name); // Construct Format
            const image = new textureManipulator.TextureObject(out.img); // Construct TextureObject
            callback(image);
        } else {
            callback(null);
        }
    });
}

function generateItemBlob(item, callback, forced) {
    if (!forced && workspaces.getIn([currentWorkspace, 'items', item.get('id'), 'blob'])) {
        callback(null);
        return;
    }
    getItemTexture(item, (image) => {
        if (image) {
            image.toPNGBlob((blob) => {
                workspaces = workspaces.mergeIn([currentWorkspace, 'items', item.get('id')], {
                    blob: URL.createObjectURL(blob),
                    blobStamp: +new Date()
                });
                callback(blob);
            });
        } else {
            callback(null);
        }
    });
}

function generateItemBlobs(parent, callback) {
    const childTextures = workspaces.getIn([currentWorkspace, 'items']).filter((i) => {
        return i.type === 'texture' && i.parentId === parent;
    });
    let i = 0;
    const length = childTextures.size;
    childTextures.forEach((texture) => {
        generateItemBlob(texture, (blob) => {
            i++;
            callback(blob, i, length);
        });
    });
}

function insertData(data, start, callback) {
    const dataPath = [currentWorkspace, 'data'];
    const length = data.length;
    let buffer = workspaces.getIn(dataPath);
    workspaces = workspaces.setIn(dataPath, Buffer.concat([buffer.slice(0, start), data, buffer.slice(start + length)]));

    const textures = workspaces.getIn([currentWorkspace, 'items']).filter((texture) => {
        if (texture.get('type') !== 'texture') {
            return false;
        }
        const textureLength = texture.get('width')*texture.get('height')*textureManipulator.getFormat(texture.get('format')).sizeModifier();
        return texture.get('address') < start + length && start < texture.get('address') + textureLength;
    });
    textures.forEach((texture) => {
        generateItemBlob(texture, () => {
            if (callback) {
                callback(texture);
            }
        }, true);
    });
}

const store = Reflux.createStore({
    onSetCurrentDirectory(item) {
        workspaces = workspaces.setIn([currentWorkspace, 'selectedDirectory'], item.get('id'));
        let lastTime = 0;
        generateItemBlobs(item.get('id'), (blob, i, length) => {
            // console.log(i, length);
            if (lastTime + 500 < +new Date() || i === length) {
                lastTime = +new Date();
                this.trigger('texture');
            }
        });
        this.trigger('directory');
    },
    onSetCurrentTexture(item) {
        workspaces = workspaces.setIn([currentWorkspace, 'selectedTexture'], item.get('id'));
        this.trigger('texture');
    },
    onSetCurrentWorkspace(workspace) {
        currentWorkspace = workspace.id;
        this.trigger('workspace');
    },
    onInsertData(data, start) {
        insertData(data, start, (texture) => {
            this.trigger('texture');
        });
        this.trigger('texture');
    },
    onCreateWorkspace(input) {
        const data = input.data;
        const filePath = input.path;
        const name = input.name;
        const key = data.toString('utf8', 0x3B, 0x3F)+data.readUInt8(0x3F);
        const id = (idCounter++).toString(36);

        let workspace = new WorkspaceRecord({
            id:                 id,
            data:               data,
            path:               filePath,
            name:               name,
            key:                key,
            items:              null,
            selectedDirectory:  null,
            selectedTexture:    null,
        });
        workspaces = workspaces.set(id, workspace);
        currentWorkspace = id;
        this.trigger('workspace');
        fileHandler.loadProfile(path.join(__dirname, '../', '/profiles/'+key+'/default/fileList.json'), (profile) => {
            const items = prepareProfile(profile);
            workspace = workspace.merge({
                items:              items,
                selectedDirectory:  'root',
            });
            workspaces = workspaces.set(id, workspace);
            sortItems();
            this.trigger('workspace');
        });
    },
    init() {
        this.listenTo(actions.setCurrentDirectory, this.onSetCurrentDirectory);
        this.listenTo(actions.setCurrentTexture, this.onSetCurrentTexture);
        this.listenTo(actions.setCurrentWorkspace, this.onSetCurrentWorkspace);
        this.listenTo(actions.createWorkspace, this.onCreateWorkspace);
        this.listenTo(actions.insertData, this.onInsertData);
    },
    getWorkspaces() {
        return workspaces;
    },
    getCurrentWorkspace() {
        return workspaces.get(currentWorkspace);
    },
    getDirectories() {
        if (!currentWorkspace) {
            return null;
        }
        const items = workspaces.getIn([currentWorkspace, 'items']);
        if (!items) {
            return null;
        }
        return items.filter(x => x.type === 'directory');
    },
    getItemOffset(item) {
        return item.get('address') - workspaces.getIn([currentWorkspace, 'items', item.get('parentId'), 'address']);
    },
});

module.exports = store;
