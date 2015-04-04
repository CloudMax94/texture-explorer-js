/*jslint node:true, browser: true */
"use strict";

var _                   = require('lodash');
var xml2js              = require('xml2js');
var path                = require('path');
var fs                  = require('fs');

var textureManipulator  = require('./lib/textureManipulator');
var TextureViewer       = require('./lib/textureViewer');
var profile             = require('./lib/profile');
var ui                  = require('./lib/ui');
require('./lib/contextmenu');
require('./lib/menu');

var container = profile.new();

function fixProfile(root) {
    container.root = root;
    profile.initialize(container);
    var mainTree = document.getElementById('mainTree');
    mainTree.innerHTML = '';
    mainTree.appendChild(container.root.ele);
    container.stringify();
}
function loadProfile() {
    console.log("loading profile");
    var profilePath = path.join(__dirname, '/profiles/NZLE15/default/fileList.json');
    var profileExt = path.extname(profilePath);
    fs.readFile(profilePath, function(err, data) {
        if (err) {
            console.log(err);
            fixProfile(null);
        } else {
            if (profileExt === '.json') {
                try {
                    var json = JSON.parse(data);
                } catch (e) {
                    console.error('There was an error parsing '+profilePath);
                    console.log(e);
                    return;
                }
                fixProfile(json);
            } else if (profileExt === '.xml') {
                var parser = new xml2js.Parser({
                    tagNameProcessors: [function(name){
                        if (name == 'directory')    return 'directories';
                        else if (name == 'texture') return 'textures';
                        return name;
                    }],
                    attrNameProcessors: []
                });
                parser.parseString(data, function (err, result) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    fixProfile(result.root);
                });
            }
        }
    });
}

var mainTree = document.getElementById('mainTree');
mainTree.dataset.columns = "File, Offset, Start, End, Size, Format, Width, Height, Palette Address";
mainTree.addEventListener('sort', function (e) {
    console.log('sorting by column '+e.detail.column+'. Ascending: '+e.detail.ascending);
    container.sort(e.detail.column, e.detail.ascending);
}, false);

function loadFile(file) {
    var reader = new FileReader();
    reader.onloadend = function(event) {
        container.file = event.target.result;
        loadProfile();
    };
    reader.readAsArrayBuffer(file);
}

var fileOpener = document.createElement('input');
fileOpener.type = 'file';
fileOpener.id = 'fileOpener';
fileOpener.style.display = 'none';
fileOpener.onchange = function(){
    loadFile(this.files[0]);
};
document.body.insertBefore(fileOpener, document.body.firstChild);

document.ondragover = function() {
    this.className = 'hover';
    return false;
};
document.ondragend = function() {
    this.className = '';
    return false;
};
document.ondrop = function(e) {
    this.className = '';
    e.preventDefault();

    var file = e.dataTransfer.files[0];
    loadFile(file);
    return false;
};

ui.createDataList('textureFormats', ['i4', 'ia4', 'i8', 'ia8', 'ia16', 'rgb5a1', 'rgba32', 'ci4', 'ci8', 'jpeg']);

var wrap = ui.createForm([
    {
        type: 'text',
        name: 'name',
        autocomplete: 'off',
    },
    {
        type: 'text',
        name: 'format',
        list: 'textureFormats',
        autocomplete: 'on',
    },
    {
        type: 'hex',
        name: 'offset',
    },
    {
        type: 'hex',
        name: 'address'
    },
    {
        type: 'number',
        name: 'width',
        min: '1',
        max: '1000'
    },
    {
        type: 'number',
        name: 'height',
        min: '1',
        max: '1000'
    },
    {
        type: 'hex',
        name: 'palette'
    }
]);
document.getElementById('preview-fields').appendChild(wrap);

var preview = new TextureViewer(container, document.getElementById('texture-preview'));
preview.assignInputs(document.getElementById('preview-fields'));
//texturePreview.initializeListeners(container);
var mainTree = document.getElementById('mainTree');
mainTree.addEventListener('rowSelected', function (e) {
    var selected = e.detail.element.object;
    if (selected.type == 'texture') {
       preview.texture  = selected;
    }
}, false);

document.getElementById('texture-test-button').onclick = function(){
    var item = preview.item;
    document.getElementById('texture-test-response').innerHTML = 'Validating...';
    item.getTexture(function(texture){
        var i = new Uint8Array(item.getArrayBuffer());
        var o = textureManipulator.generateData(texture, item.getData('format')).data;
        var isEqual = _.isEqual(i, o);
        if (isEqual) {
            document.getElementById('texture-test-response').innerHTML = 'Success.';
        } else {
            document.getElementById('texture-test-response').innerHTML = 'Failure. Check console.';
            _.each(o, function(val, index){
                if (val !== i[index]) {
                    console.log('Byte 0x'+index.toString(16).toUpperCase()+': 0x'+_.padLeft(val.toString(16).toUpperCase(), 2, 0)+' != 0x'+_.padLeft(i[index].toString(16).toUpperCase(), 2, 0));
                }
            });
            console.log(i);
            console.log(o);
        }
    });
};
//test