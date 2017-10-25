import Worker from './worker'

function createWorkerPool () {
  let pool = {
    pos: 0,
    workers: [],
    send (msg) {
      this.workers[this.pos].postMessage(msg)
      this.pos = (this.pos + 1) % this.workers.length
    },
    on (type, callback) {
      for (let i = 0; i < this.workers.length; i++) {
        this.workers[i].addEventListener(type, function (ev) {
          callback(ev.data)
        })
      }
    }
  }

  let workerCount = 4
  if (!process.browser) {
    workerCount = Math.min(workerCount, require('os').cpus().length)
  }

  for (let i = 0; i < workerCount; i++) {
    pool.workers.push(new Worker())
  }

  const worker = {
    pool: pool,
    callbacks: {},
    send (input, callback) {
      const d = new Date()
      const id = d.getTime() + '-' + Math.random()
      this.callbacks[id] = callback
      this.pool.send({
        id: id,
        input: input
      })
    }
  }

  worker.pool.on('message', function (msg) {
    if (msg.id) {
      worker.callbacks[msg.id](msg.output)
      delete worker.callbacks[msg.id]
    } else {
      console.log(msg)
    }
  })
  return worker
}

export default createWorkerPool()
