import { join } from 'path'

export default function (path) {
  let proc
  if (process.browser) {
    const workers = {
      textures: require('./workers/textures')
    }
    let work = require('webworkify')
    proc = {
      worker: work(workers[path]),
      send (msg) {
        this.worker.postMessage(msg)
      },
      on (type, callback) {
        this.worker.addEventListener(type, function (ev) {
          callback(ev.data)
        })
      }
    }
  } else {
    const numCPUs = Math.min(4, require('os').cpus().length)
    proc = {
      pos: 0,
      procs: [],
      send (msg) {
        this.procs[this.pos].send(msg)
        this.pos = (this.pos + 1) % this.procs.length
      },
      on (type, callback) {
        for (let i = 0; i < this.procs.length; i++) {
          this.procs[i].on(type, callback)
        }
      }
    }
    for (let i = 0; i < numCPUs; i++) {
      const p = require('child_process').fork(join(__dirname, '/workers/', path))
      proc.procs.push(p)
    }
  }
  const worker = {
    process: proc,
    callbacks: {},
    send (input, callback) {
      const d = new Date()
      const id = d.getTime() + '-' + Math.random()
      this.callbacks[id] = callback
      this.process.send({
        id: id,
        input: input
      })
    }
  }
  worker.process.on('message', function (msg) {
    if (msg.id) {
      worker.callbacks[msg.id](msg.output)
      delete worker.callbacks[msg.id]
    } else {
      console.log(msg)
    }
  })
  return worker
}
