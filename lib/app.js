/*jslint node:true, browser: true */
"use strict";

var _                   = require('lodash');
var xml2js              = require('xml2js');
var path                = require('path');
var fs                  = require('fs');
var argv                = require('remote').getGlobal('argv');

var textureManipulator  = require('./textureManipulator');
var TextureViewer       = require('./textureViewer');
var container           = require('./container');
var ui                  = require('./ui');
require('./contextmenu');
require('./menu');
require('./worker');

_.each(argv._, function(path){
    fs.exists(path, function(exists) {
        if (exists) {
            console.log("Autoloading "+path+" since it was provided in argv.");
            fs.readFile(path, function (err, data) {
                if (err) throw err;
                container.file = data;
                loadProfile();
            });
        }
    });
});

function fixProfile(root) {
    //container.root = root;
    //container.initialize();
    container.initialize(root);
    var mainTree = document.getElementById('mainTree');
    mainTree.innerHTML = '';
    mainTree.appendChild(container.root.ele);
}
function loadProfile() {
    console.log("loading profile");
    var profilePath = path.join(__dirname, '../', '/profiles/NZLE15/default/fileList.json');
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
mainTree.addEventListener('sort', function (event) {
    console.log('sorting by column '+event.detail.column+'. Ascending: '+event.detail.ascending);
    container.sort(event.detail.column, event.detail.ascending);
}, false);

function loadFile(file) {
    var reader = new FileReader();
    reader.onloadend = function(event) {
        container.file = new Buffer(new Uint8Array(event.target.result));
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
document.ondrop = function(event) {
    this.className = '';
    event.preventDefault();

    var file = event.dataTransfer.files[0];
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
        autocomplete: 'off',
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
mainTree.addEventListener('rowSelected', function (event) {
    var selected = event.detail.element.object;
    if (selected.type == 'texture') {
       preview.texture  = selected;
    }
}, false);

document.getElementById('texture-test-button').onclick = function(){
    var texture = preview.item;
    document.getElementById('texture-test-response').innerHTML = 'Validating...';
    texture.getTexture(function(image){
        var input = texture.getBuffer();
        var output = textureManipulator.generateData(image, texture.getData('format'));

        var isEqual = true;
        for (var i = 0; i < output.length; i++) {
            if (input[i] !== output[i]) {
                isEqual = false;
                break;
            }
        }

        if (isEqual) {
            document.getElementById('texture-test-response').innerHTML = 'Success.';
        } else {
            document.getElementById('texture-test-response').innerHTML = 'Failure. Check console.';
            /*
            _.each(output, function(val, index){
                if (val !== input[index]) {
                    console.log('Byte 0x'+index.toString(16).toUpperCase()+': 0x'+_.padLeft(val.toString(16).toUpperCase(), 2, 0)+' != 0x'+_.padLeft(input[index].toString(16).toUpperCase(), 2, 0));
                }
            });
            */
        }
    });
};
