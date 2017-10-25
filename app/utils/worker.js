import textureManipulator from './textureManipulator'

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

self.addEventListener('message', function (ev) {
  work(ev.data, (err, msg) => {
    if (err) {
      self.postMessage(err)
    } else {
      self.postMessage(msg)
    }
  })
})
