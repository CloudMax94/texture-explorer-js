require('babel-register')
var textureManipulator = require('../textureManipulator')

function work (msg, callback) {
  var input = msg.input
  if (input.type !== 'generatePNGBuffer') {
    return
  }
  var palette
  if (input.palette) {
    palette = Buffer.from(input.palette)
  }

  var img = textureManipulator.generateTexture(Buffer.from(input.data), input.format, input.width, palette)
  if (img) {
    img.toPNGBuffer((buffer) => {
      // TODO: handle errors...?
      callback(null, {
        id: msg.id,
        type: msg.type,
        output: {
          img: img,
          buffer: buffer
        }
      })
    })
  } else {
    callback(null, {
      id: msg.id,
      type: msg.type,
      output: {}
    })
  }
}

if (process.browser) {
  self.addEventListener('message', function (ev) {
    work(ev.data, (err, msg) => {
      if (err) {
        self.postMessage(err)
      } else {
        self.postMessage(msg)
      }
    })
  })
} else {
  process.title = 'TE.js Worker'
  process.on('message', function (msg) {
    work(msg, (err, msg) => {
      if (err) {
        process.send(err)
      } else {
        process.send(msg)
      }
    })
  })
}
