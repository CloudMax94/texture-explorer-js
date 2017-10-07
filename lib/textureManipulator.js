import { defaults, each, flatten } from 'lodash'
import PNGEncoder from 'png-stream/encoder'
import PNGDecoder from 'png-stream/decoder'

function findFirstSet (x) {
  if (x === 0) return 0
  let t = 1
  let i = 0
  while ((x & t) === 0) {
    t <<= 1
    i++
  }
  return i
}

class TextureFormat {
  constructor (data = {}) {
    defaults(data, {
      id: 0xFF,
      name: 'null',
      description: 'Unknown format.',
      bits: 8,
      palette: false
    })
    this.data = data

    if (data.mask) {
      const bitwise = {}
      let bits = 0
      each(data.mask, (val, key) => {
        bitwise[key] = {
          mask: val
        }
        bits = Math.max(bits, (val.toString(16).length / 2) * 8)
        const i = findFirstSet(val)
        bitwise[key].shift = i
        bitwise[key].multiplier = 255 / (val >>> i)
      })
      delete this.data.mask
      this.data.bitwise = bitwise
      this.data.bits = bits
    }
  }
  rawToPixels (d) {
    const pixels = []
    let data
    if (this.data.bits < 5) {
      data = [(d & 0xF0) >> 4, d & 0x0F]
    } else {
      data = [d]
    }
    if (this.hasPalette()) {
      return data
    }
    for (let i = 0, len = data.length; i < len; i++) {
      const colors = []
      each(this.data.bitwise, (bitwise) => {
        colors.push(Math.round(((data[i] & bitwise.mask) >>> bitwise.shift) * bitwise.multiplier))
      })
      pixels.push(colors)
    }

    return pixels
  }

  pixelsToRaw (pixels) {
    const bytes = Math.ceil(this.data.bits / 8)
    const outArray = []
    let out = 0

    for (let i = 0, len = pixels.length; i < len; i++) {
      const pixel = pixels[i]

      let data = 0
      each(this.data.bitwise, (bitwise, key) => {
        data |= ((pixel[key] / bitwise.multiplier) << bitwise.shift)
        data >>>= 0 // Make data unsigned
      })
      out = (out << (this.data.bits * i)) | data
    }

    for (let i = 0; i < bytes; i++) {
      outArray[bytes - 1 - i] = out >> (i * 8) & 0xFF
    }

    return outArray
  }

  get name () {
    return this.data.name
  }

  get id () {
    return this.data.id
  }

  get bytes () {
    return Math.ceil(this.data.bits / 8)
  }

  get description () {
    return this.data.description
  }

  hasPalette () {
    return this.data.palette
  }

  paletteSize () {
    return Math.pow(2, this.data.bits)
  }

  sizeModifier () {
    return this.data.bits / 8
  }

  isValid () {
    return this.id !== 0xFF
  }

  toString () {
    return this.name
  }
}

const textureFormats = {
  /*
  bpp: new TextureFormat({
    id: 0xbb,
    name: '2bpp',
    description: '2 bit per pixel. All channels share value.',
    mask: [
      0x3,
      0x3,
      0x3,
      0x3,
    ],
  }),
  */
  i4: new TextureFormat({
    id: 0x80,
    name: 'i4',
    description: '4 bit per pixel. All channels share value.',
    mask: [
      0xF,
      0xF,
      0xF,
      0xF
    ]
  }),
  i8: new TextureFormat({
    id: 0x88,
    name: 'i8',
    description: '8 bit per pixel. All channels share value.',
    mask: [
      0xFF,
      0xFF,
      0xFF,
      0xFF
    ]
  }),
  ia4: new TextureFormat({
    id: 0x60,
    name: 'ia4',
    description: '4 bit per pixel. 3 bit for greyscale channel, 1 bit for alpha channel.',
    mask: [
      0xE,
      0xE,
      0xE,
      0x1
    ]
  }),
  ia8: new TextureFormat({
    id: 0x68,
    name: 'ia8',
    description: '8 bit per pixel. 4 bit for greyscale channel, 4 bit for alpha channel.',
    mask: [
      0xF0,
      0xF0,
      0xF0,
      0x0F
    ]
  }),
  ia16: new TextureFormat({
    id: 0x70,
    name: 'ia16',
    description: '16 bit per pixel. 8 bit for greyscale channel, 8 bit for alpha channel.',
    mask: [
      0xFF00,
      0xFF00,
      0xFF00,
      0x00FF
    ]
  }),
  rgb5a1: new TextureFormat({
    id: 0x10,
    name: 'rgb5a1',
    description: '16 bit per pixel. 5 bit per color channel, 1 bit for alpha channel. Also known as rgba16.',
    mask: [
      0xF800,
      0x07C0,
      0x003E,
      0x0001
    ]
  }),
  rgba32: new TextureFormat({
    id: 0x18,
    name: 'rgba32',
    description: '32 bit per pixel. 8 bit per color channel, 8 bit for alpha channel.',
    mask: [
      0xFF000000,
      0x00FF0000,
      0x0000FF00,
      0x000000FF
    ]
  }),
  ci4: new TextureFormat({
    id: 0x40,
    name: 'ci4',
    description: '4 bit per pixel. Uses a rgb5a1 palette.',
    bits: 4,
    palette: true
  }),
  ci8: new TextureFormat({
    id: 0x48,
    name: 'ci8',
    description: '8 bit per pixel. Uses a rgb5a1 palette.',
    bits: 8,
    palette: true
  }),
  jpeg: new TextureFormat({
    id: 0xFE,
    name: 'jpeg',
    description: 'Uses the JPEG File Interchange Format (JFIF) standard.'
  })
}

function getFormats () {
  let list = []
  for (let format in textureFormats) {
    list.push(getFormat(format))
  }
  return list
}

function getFormat (format = '') {
  format = format.toLowerCase()
  if (format in textureFormats) {
    return textureFormats[format]
  }
  return new TextureFormat({name: format})
}

function fourToByte (arr) {
  for (let i = 0, l = arr.length; i < l; i += 2) {
    arr[i / 2] = (arr[i] << 4) | arr[i + 1]
  }
  arr.length /= 2
  return arr
}

class TextureObject {
  constructor (...args) {
    if (args.length === 1) {
      each(args[0], (value, key) => {
        this[key] = value
      })
      return
    }
    this.palette = null
    this.width = args[0]
    this.height = args[1]
    this.format = args[2]
    this.pos = 0
    this.data = []
    if (!this.format.hasPalette()) {
      this.dataSize = 4
    } else {
      this.dataSize = 1
    }
  }

  get length () {
    return this.data.length
  }

  setPixel (...args) {
    let pos, color
    if (args.length === 2) {
      pos = args[0]
      color = args[1]
    } else {
      pos = this.pos
      color = args[0]
    }
    if (!this.format.hasPalette()) {
      if (color.length < 4) {
        color.push(0xFF)
      }
      for (let i = 0, len = color.length; i < len; i++) {
        this.data[pos + i] = color[i]
      }
    } else {
      this.data[pos] = color
    }
    this.pos = pos + this.dataSize
  }

  start () {
    this.pos = 0
  }

  getPixel (pos = this.pos) {
    let out
    if (!this.format.hasPalette()) {
      out = this.data.slice(pos, pos + this.dataSize)
    } else {
      out = this.data[this.pos]
    }
    this.pos = pos + this.dataSize
    return out
  }

  atEnd () {
    return (this.length <= this.pos)
  }

  setPalette (palette) {
    this.palette = palette
  }

  toBase64 () { // Faster conversion, but also lossy! Use this for tree view?
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = this.width
    canvas.height = this.height
    const imageData = ctx.createImageData(this.width, this.height)
    imageData.data.set(this.data)
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL()
  }

  toPNGBlob (callback) {
    this.toPNGBuffer((buffer) => {
      callback(new Blob([Uint8Array.from(buffer)], {type: 'image/png'}))
    })
  }

  toPNGBuffer (callback) {
    let encoder
    if (!this.format.hasPalette()) {
      encoder = new PNGEncoder(this.width, this.height, {colorSpace: 'rgba'})
    } else {
      encoder = new PNGEncoder(this.width, this.height, {colorSpace: 'indexed', palette: Buffer.from(this.palette)})
    }

    const buffers = []
    encoder.on('data', (chunk) => {
      buffers.push(chunk)
    })
    encoder.on('end', (a) => {
      callback(Buffer.concat(buffers))
    })
    encoder.end(Buffer.from(flatten(this.data)))
  }
}

module.exports = {
  TextureObject,
  getFormats,
  getFormat,
  pngToPixelData (pngBuffer, callback) {
    // decode a PNG file to RGB pixels
    const decoder = new PNGDecoder({indexed: true})

    let format = {}

    const buffers = []
    decoder.on('data', (chunk) => {
      buffers.push(chunk)
    })
    decoder.on('format', (data) => {
      format = data
    })
    decoder.on('end', () => {
      const buffer = Buffer.concat(buffers)
      callback(buffer, format)
    })
    decoder.end(Buffer.from(flatten(pngBuffer)))
  },
  generateTexture (buffer, format, width, palette) {
    if (typeof format === 'string') {
      format = getFormat(format)
    }
    if ((format.hasPalette() && palette === undefined) ||
      (format === textureFormats.jpeg)) {
      return null
    }
    if (Array.isArray(buffer)) {
      buffer = Buffer.from(buffer)
    }

    const imgBuffer = {
      data: buffer,
      length: buffer.length,
      pos: 0,
      readUIntBE (byteLength) {
        let data = 0
        while (byteLength !== 0) {
          data = (data << 8) | this.data.readUInt8(this.pos)
          this.pos += 1
          byteLength--
        }
        return data
      },
      atEnd () {
        return (this.length === this.pos)
      }
    }
    const height = (imgBuffer.length / format.sizeModifier()) / width
    const texture = new TextureObject(width, height, format)
    if (format.hasPalette()) {
      palette = this.generateTexture(palette, textureFormats.rgb5a1, format.paletteSize()).data
      texture.setPalette(palette)
    }
    while (!imgBuffer.atEnd()) {
      const pixels = format.rawToPixels(imgBuffer.readUIntBE(format.bytes))
      for (let i = 0, len = pixels.length; i < len; i++) {
        texture.setPixel(pixels[i])
      }
    }
    return texture
  },
  pixelDataToRaw (buffer, format) {
    if (typeof format === 'string') {
      format = getFormat(format)
    }

    if (Array.isArray(buffer)) {
      buffer = Buffer.from(buffer)
    }

    if (format.hasPalette()) {
      // TODO: unnecessary back and forth conversion?
      let out = Array.prototype.slice.call(buffer, 0)
      if (format.data.bits === 4) {
        out = fourToByte(out)
      }
      return Buffer.from(out)
    }

    const imgBuffer = {
      data: buffer,
      length: buffer.length,
      pos: 0,
      readUIntBE (byteLength) {
        let data = 0
        while (byteLength !== 0) {
          data = (data << 8) | this.data.readUInt8(this.pos)
          this.pos += 1
          byteLength--
        }
        return data
      },
      atEnd () {
        return (this.length === this.pos)
      }
    }

    let out = []
    while (!imgBuffer.atEnd()) {
      const data = format.pixelsToRaw([
        [
          imgBuffer.readUIntBE(1),
          imgBuffer.readUIntBE(1),
          imgBuffer.readUIntBE(1),
          imgBuffer.readUIntBE(1)
        ]
      ])
      out.push(data)
    }
    out = flatten(out)

    if (format.data.bits === 4) {
      out = fourToByte(out)
    }
    return Buffer.from(out)
  }

}
