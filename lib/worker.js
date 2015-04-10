/*jslint node:true, browser: true, esnext: true */
"use strict";

module.exports = function(path){
    var proc;
    var workers = {
        'textures': require('./workers/textures')
    };
    if (process.browser) {
        proc = workers[path];
    } else {
        proc = require('child_process').fork(__dirname+'/workers/'+path);
    }
    var worker = {
        process: proc,
        callbacks: {},
        send(input, callback){
            var d = new Date();
            var id = d.getTime()+'-'+Math.random();
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
