module.exports = function(path){
    var proc;
    var workers = {
        'textures': require('./workers/textures')
    };
    if (process.browser) {
        proc = workers[path];
    } else {
        var numCPUs = Math.min(4, require('os').cpus().length);
        proc = {
            pos: 0,
            procs: [],
            send(msg) {
                this.procs[this.pos].send(msg);
                this.pos = (this.pos+1)%this.procs.length;
            },
            on(type, callback) {
                for (let i = 0; i < this.procs.length; i++) {
                    this.procs[i].on(type, callback);
                }
            }
        };
        for (var i = 0; i < numCPUs; i++) {
            var p = require('child_process').fork(__dirname+'/workers/'+path);
            proc.procs.push(p);
        }
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
