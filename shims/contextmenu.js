/*jslint node:true, browser: true, esnext: true */
"use strict";

var _ = require('lodash');
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('mainTree').addEventListener('contextmenu', function (event) {
        if (event.target.tagName == 'TREE-ITEM') {
            event.preventDefault();
            var obj = event.target.object;
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
