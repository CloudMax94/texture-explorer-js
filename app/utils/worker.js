import { generateTexture } from './texture'

function work (msg, callback) {
  var input = msg.input
  if (input.type !== 'generatePNGBuffer') {
    return
  }
  var palette
  if (input.palette) {
    palette = Buffer.from(input.palette)
  }
  let img
  try {
    img = generateTexture(Buffer.from(input.data), input.format, input.width, palette)
  } catch (error) {
    callback(null, {
      id: msg.id,
      type: msg.type,
      output: {}
    })
    return
  }
  if (img && img.size) {
    img.toPNGBuffer().then(function (buffer) {
      callback(null, {
        id: msg.id,
        type: msg.type,
        output: {
          img: img,
          buffer: buffer
        }
      })
      return buffer
    }).catch(function (error) {
      console.error(error)
      callback(null, {
        id: msg.id,
        type: msg.type,
        output: {}
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
