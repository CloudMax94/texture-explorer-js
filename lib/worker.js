/*jslint node:true, browser: true, esnext: true */
"use strict";

module.exports = function(path){
    var worker = {
        process: require('child_process').fork(__dirname+'/workers/'+path),
        callbacks: {},
        send(input, callback){
            var hrTime = process.hrtime();
            var id = hrTime[0] * 1000000 + hrTime[1] / 1000;
            this.callbacks[id] = callback;
            this.process.send({
                'id': id,
                'input': input
            });
        }
    };
    worker.process.on('message', function(msg){
        if (msg.id) {
            worker.callbacks[msg.id](msg.output);
            delete worker.callbacks[msg.id];
        } else {
            console.log(msg);
        }
    });
    return worker;
};
