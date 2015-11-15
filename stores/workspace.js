const Reflux      = require('reflux');
const actions     = require('../actions/workspace');
const _           = require('lodash');
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
    blobHash:       null,
    blobStamp:      0,
});

var WorkspaceRecord = Immutable.Record({
    id:                 null,
    data:               null,
    path:               null,
    name:               'New Workspace',
    key:                null,
    items:              null,
    selectedDirectory:  null,
    selectedTexture:    null,
});

var BlobRecord = Immutable.Record({
    hash:  null,
    url:   null,
    start: null,
    end:   null,
});

let blobBank = Immutable.Map();

function getItemHash(item) {
    const crypto = require('crypto');
    const md5sum = crypto.createHash('md5');
    md5sum.update(item.get('address').toString());
    md5sum.update(item.get('width').toString());
    md5sum.update(item.get('height').toString());
    md5sum.update(item.get('format').toString());
    return md5sum.digest('hex');
}

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
                    const id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
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
                        item = item.set('blobHash', getItemHash(item));
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

const store = Reflux.createStore({
    onSetCurrentDirectory(item) {
        workspaces = workspaces.setIn([currentWorkspace, 'selectedDirectory'], item.get('id'));
        this.trigger('directory');
    },
    onSetCurrentTexture(item) {
        workspaces = workspaces.setIn([currentWorkspace, 'selectedTexture'], item);
        this.trigger('texture');
    },
    onSetCurrentWorkspace(workspace) {
        currentWorkspace = workspace.id;
        this.trigger('workspace');
    },
    onCreateWorkspace(input) {
        const data = input.data;
        const filePath = input.path;
        const name = input.name;
        const key = data.toString('utf8', 0x3B, 0x3F)+data.readUInt8(0x3F);
        const id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);

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

            this.generateAllItemBlobs();
            this.trigger('workspace');
        });
    },
    init() {
        this.listenTo(actions.setCurrentDirectory, this.onSetCurrentDirectory);
        this.listenTo(actions.setCurrentTexture, this.onSetCurrentTexture);
        this.listenTo(actions.setCurrentWorkspace, this.onSetCurrentWorkspace);
        this.listenTo(actions.createWorkspace, this.onCreateWorkspace);
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
        const items = this.getCurrentWorkspace().get('items');
        if (!items) {
            return null;
        }
        return items.filter(x => x.type === 'directory');
    },
    getItemOffset(item) {
        return item.get('address') - this.getCurrentWorkspace().getIn(['items', item.get('parentId'), 'address']);
    },
    getItemBuffer(item) {
        return this.getCurrentWorkspace().get('data').slice(
            item.get('address'),
            item.get('address')+item.get('width')*item.get('height')*textureManipulator.getFormat(item.get('format')).sizeModifier()
        );
    },
    getItemPaletteBuffer(item) {
        const parentId = item.get('parentId');
        const parent = this.getCurrentWorkspace().getIn(['items', parentId]);
        if (parent) {
            return this.getCurrentWorkspace().get('data').slice(
                parent.get('address')+item.get('palette'),
                parent.get('address')+item.get('palette')+0x200
            );
        }
        return null;
    },
    itemHasValidData(item) {
        if (item.get('type') === 'texture') {
            if (Number.isInteger(item.get('address')) &&
                Number.isInteger(item.get('width')) &&
                Number.isInteger(item.get('height')) &&
                textureManipulator.getFormat(item.get('format')).isValid()) {
                return true;
            }
        }
        return false;
    },
    getItemTexture(item, callback) {
        if (item.get('type') !== 'texture' || !this.itemHasValidData(item)) {
            callback(null);
            return;
        }

        let palette;
        const textureFormat = textureManipulator.getFormat(item.get('format'));
        if (textureFormat.hasPalette()) {
            palette = this.getItemPaletteBuffer(item);
        }
        textureWorker.send({
            type: 'generateTexture',
            data: this.getItemBuffer(item),
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
    },
    generateAllItemBlobs() {
        const childTextures = this.getCurrentWorkspace().get('items').filter((i) => {
            return i.type === 'texture';
        });
        let lastTime = 0;
        let i = 0;
        const length = childTextures.size;
        childTextures.forEach((texture) => {
            this.generateItemBlob(texture, (blob, hash) => {
                i++;
                if (lastTime + 1000 < +new Date() || i === length) {
                    lastTime = +new Date();
                    this.trigger('texture');
                }
            });
        });
    },
    generateItemBlob(item, callback) {
        const hash = getItemHash(item);
        const crntBlob = blobBank.get(hash);
        if (!crntBlob) {
            blobBank = blobBank.set(hash, true);
            this.getItemTexture(item, (image) => {
                if (image) {
                    image.toPNGBlob((blob) => {
                        blobBank = blobBank.set(hash, new BlobRecord({
                            hash: hash,
                            url: URL.createObjectURL(blob),
                            start: item.get('address'),
                            end: item.get('address')+item.get('width')*item.get('height')*textureManipulator.getFormat(item.get('format')).sizeModifier(),
                        }));
                        const texturesToUpdate = this.getCurrentWorkspace().get('items').filter((i) => {
                            return i.blobHash === hash;
                        });
                        texturesToUpdate.forEach((texture, i) => {
                            workspaces = workspaces.setIn([currentWorkspace, 'items', i, 'blobStamp'], +new Date());
                        });
                        callback(blob, hash);
                    });
                } else {
                    callback(null, hash);
                }
            });
        } else {
            callback(crntBlob, hash);
        }
    },
    getBlobUrl(hash) {
        return blobBank.getIn([hash, 'url']);
    },
});

module.exports = store;
