/*jslint node:true, browser: true */
"use strict";

var _ = require('lodash');
document.addEventListener("DOMContentLoaded", function(event) {
    document.getElementById('mainTree').addEventListener('contextmenu', function (e) {
        if (e.target.tagName == 'TREE-ITEM') {
            e.preventDefault();
            var obj = e.target.object;
            if (obj.type == 'texture') {
                var texture = obj.getTexture(function(texture){
                    if (texture) {
                        texture.toPNGBlob(function(blob){
                            var blobURLref = URL.createObjectURL(blob);
                            console.log(blobURLref);
                            saveAs(blob, obj.getData('name'));
                        });
                    } else {
                        console.error('Could not generate texture.');
                    }
                });
            }
        }
    }, false);
});