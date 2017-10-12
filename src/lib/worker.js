import { join } from 'path'

export default function (path) {
  let proc
  if (process.browser) {
    const workers = {
      textures: require.resolve('./workers/textures')
    }
    let work = require('webworkify-webpack')
    proc = {
      pos: 0,
      pool: [],
      send (msg) {
        this.pool[this.pos].postMessage(msg)
        this.pos = (this.pos + 1) % this.pool.length
      },
      on (type, callback) {
        for (let i = 0; i < this.pool.length; i++) {
          this.pool[i].addEventListener(type, function (ev) {
            callback(ev.data)
          })
        }
      }
    }
    for (let i = 0; i < 4; i++) {
      proc.pool.push(work(workers[path]))
    }
  } else {
    const numCPUs = Math.min(4, require('os').cpus().length)
    proc = {
      pos: 0,
      pool: [],
      send (msg) {
        this.pool[this.pos].send(msg)
        this.pos = (this.pos + 1) % this.pool.length
      },
      on (type, callback) {
        for (let i = 0; i < this.pool.length; i++) {
          this.pool[i].on(type, callback)
        }
      }
    }
    for (let i = 0; i < numCPUs; i++) {
      proc.pool.push(require('child_process').fork(join(__dirname, '/workers/', path)))
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
