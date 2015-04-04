var textureManipulator  = require('./textureManipulator');

process.on('message', function(msg){
    var img = textureManipulator[msg.func].apply(this, msg.args);
    if (img) {
        img.toPNGBlob(function(blob){
            process.send({img: blob, id: msg.id});
        });
    } else {
        process.send(null);
    }
});