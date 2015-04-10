require("babel/register");
var textureManipulator = require('../textureManipulator');

process.on('message', function(msg){
    var input = msg.input;
    if (input.type != 'generateTexture') {
        return;
    }
    var palette;
    if (input.palette) {
        palette = new Buffer(input.palette);
    }

    var img = textureManipulator.generateTexture(new Buffer(input.data), input.format, input.width, palette);
    process.send({
        id: msg.id,
        type: msg.type,
        output: {img: img}
    });
});
