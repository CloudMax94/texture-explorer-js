/*jslint node:true, browser: true */
"use strict";

var _                   = require('lodash');

var ui = require('./ui');

var tabs = document.createElement('div');
tabs.id = 'tabs';
document.getElementById('workspace').appendChild(tabs);

var statusBar = document.createElement('div');
statusBar.id = 'status-bar';
document.getElementById('app').appendChild(statusBar);

require('./fileHandler');
require('./contextmenu');
require('./menu');

ui.createDataList('textureFormats', ['i4', 'ia4', 'i8', 'ia8', 'ia16', 'rgb5a1', 'rgba32', 'ci4', 'ci8', 'jpeg']);

document.getElementById('preview-fields').appendChild(ui.createForm([
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
]));

/*
var textureManipulator = require('./textureManipulator');
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
            _.each(output, function(val, index){
                if (val !== input[index]) {
                    console.log('Byte 0x'+index.toString(16).toUpperCase()+': 0x'+_.padLeft(val.toString(16).toUpperCase(), 2, 0)+' != 0x'+_.padLeft(input[index].toString(16).toUpperCase(), 2, 0));
                }
            });
        }
    });
};
*/
