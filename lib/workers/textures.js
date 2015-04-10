/*jslint node:true, browser: true, esnext: true */

require("babel/register");
var textureManipulator = require('../textureManipulator');

var work = function(msg, callback){
    var input = msg.input;
    if (input.type != 'generateTexture') {
        return;
    }
    var palette;
    if (input.palette) {
        palette = new Buffer(input.palette);
    }

    var img = textureManipulator.generateTexture(new Buffer(input.data), input.format, input.width, palette);
    var out = {
        id: msg.id,
        type: msg.type,
        output: {img: img}
    };

    if (callback)
        callback(out);
    else
        process.send(out);
};
process.on('message', work);

module.exports = { //Process shim for Browser Mode
    _callBack: undefined,
    on: function(type, callback) {
        this._callBack = callback;
    },
    send: function(data) {
        work(data, this._callBack);
    }
};
