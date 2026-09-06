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

function twoToByte (arr) {
  for (let i = 0, l = arr.length; i < l; i += 4) {
    arr[i / 4] = (arr[i] << 6) | (arr[i + 1] << 4) | (arr[i + 2] << 2) | arr[i + 3]
  }
  arr.length /= 4
  return arr
}

function fourToByte (arr) {
  for (let i = 0, l = arr.length; i < l; i += 2) {
    arr[i / 2] = (arr[i] << 4) | arr[i + 1]
  }
  arr.length /= 2
  return arr
}

class TextureFormat {
  constructor (data = {}) {
    data = Object.assign({
      id: 0xFF,
      name: 'null',
      description: 'Unknown format.',
      bits: 8,
      palette: false
    }, data)
    this._data = data
    if (data.mask) {
      const bitwise = {}
      let bits = 0
      for (let key in data.mask) {
        let val = data.mask[key]
        bits = Math.max(bits, val.toString(2).length)
        const i = findFirstSet(val)
        bitwise[key] = {
          mask: val,
          shift: i,
          multiplier: 255 / (val >>> i)
        }
      }
      delete this._data.mask
      this._data.bitwise = bitwise
      this._data.bits = bits
    }
  }

  // Returns one pixel from the raw data
  // For formats that use less than one byte per pixel, it will return
  // The number of pixels required to make up one byte
  rawToPixels (d) {
    const pixels = []
    let data
    if (this._data.bits === 4) {
      data = [
        (d & 0xF0) >> 4,
        d & 0x0F
      ]
    } else if (this._data.bits === 2) {
      data = [
        (d & 0xC0) >> 6,
        (d & 0x30) >> 4,
        (d & 0x0C) >> 2,
        d & 0x03
      ]
    } else {
      data = [d]
    }
    if (this.hasPalette()) {
      return data
    }
    for (let i = 0, len = data.length; i < len; i++) {
      const colors = [0, 0, 0, 255]
      for (let [key, bitwise] of Object.entries(this._data.bitwise)) {
        colors[key] = Math.round(((data[i] & bitwise.mask) >>> bitwise.shift) * bitwise.multiplier)
      }
      pixels.push(colors)
    }
    return pixels
  }

  // Returns an array of raw data bytes
  pixelsToRaw (pixels) {
    const bytes = this.bytes
    const outArray = []
    let out = 0

    for (let i = 0, len = pixels.length; i < len; i++) {
      const pixel = pixels[i]
      let data = 0
      for (let [key, bitwise] of Object.entries(this._data.bitwise)) {
        data |= Math.round(pixel[key] / bitwise.multiplier) << bitwise.shift
        data >>>= 0 // Make data unsigned
      }
      out = (out << (this._data.bits)) | data
    }

    for (let i = 0; i < bytes; i++) {
      outArray[bytes - 1 - i] = out >> (i * 8) & 0xFF
    }

    return outArray
  }

  get name () {
    return this._data.name
  }

  get id () {
    return this._data.id
  }

  get bits () {
    return this._data.bits
  }

  get bytes () {
    return Math.ceil(this.bits / 8)
  }

  get description () {
    return this._data.description
  }

  hasPalette () {
    return this._data.palette
  }

  paletteSize () {
    return Math.pow(2, this._data.bits)
  }

  sizeModifier () {
    console.warn(`TextureFormat.sizeModifier() is deprecated, use (TextureFormat.bits / 8) directly`)
    return this.bits / 8
  }

  isValid () {
    return this.id !== 0xFF
  }

  toString () {
    return this.name
  }
}

const textureFormats = {
  bpp: new TextureFormat({
    id: 0xbb,
    name: '2bpp',
    description: '2 bit per pixel. All channels share value.',
    mask: [
      0x3,
      0x3,
      0x3
    ]
  }),
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

class TextureObject {
  constructor (...args) {
    if (args.length === 1) {
      for (let [key, value] of Object.entries(args[0])) {
        this[key] = value
      }
      return
    }
    this.width = args[0]
    this.height = args[1]
    this.format = args[2]
    this.palette = args[3] || null
    this.data = []
    if (this.format.hasPalette()) {
      this.dataSize = 1
    } else {
      this.dataSize = 4
    }
  }

  get size () {
    return this.height * this.width
  }

  setPixel (pos, color) {
    if (this.format.hasPalette()) {
      this.data[pos] = color
    } else {
      if (color.length < 4) {
        color.push(0xFF)
      }
      for (let i = 0; i < color.length; i++) {
        this.data[pos * this.dataSize + i] = color[i]
      }
    }
  }

  getPixel (pos) {
    let out
    if (!this.format.hasPalette()) {
      out = this.data.slice(pos * this.dataSize, pos * this.dataSize + this.dataSize)
    } else {
      out = this.data[pos]
    }
    return out
  }

  setPalette (palette) {
    this.palette = palette
  }

  toBase64 () { // NOTE: Fast, but lossy
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = this.width
    canvas.height = this.height
    const imageData = ctx.createImageData(this.width, this.height)
    imageData.data.set(this.data)
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL('image/png')
  }

  async toPNGBlob () {
    let buffer = await this.toPNGBuffer()
    return new Blob([Uint8Array.from(buffer)], {type: 'image/png'})
  }

  toPNGBuffer () {
    return new Promise((resolve, reject) => {
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
      encoder.on('end', () => {
        resolve(Buffer.concat(buffers))
      })
      encoder.end(Buffer.from(this.data))
    })
  }
}

export function getFormats () {
  return Object.values(textureFormats)
}

export function getFormat (format = '') {
  if (!format) {
    return
  }
  format = format.toLowerCase()
  if (!(format in textureFormats)) {
    textureFormats[format] = new TextureFormat({name: format})
  }
  return textureFormats[format]
}

// decode a PNG file to RGB pixels
export function pngToPixelData (pngBuffer) {
  return new Promise((resolve, reject) => {
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
      resolve([buffer, format])
    })
    decoder.end(Buffer.from(pngBuffer))
  })
}

export function generateTexture (buffer, format, width, palette) {
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
  const height = (imgBuffer.length / (format.bits / 8)) / width
  const texture = new TextureObject(width, height, format)
  if (format.hasPalette()) {
    palette = generateTexture(palette, textureFormats.rgb5a1, format.paletteSize()).data
    texture.setPalette(palette)
  }
  let pindex = 0
  while (!imgBuffer.atEnd()) {
    const pixels = format.rawToPixels(imgBuffer.readUIntBE(format.bytes))
    for (let pixel of pixels) {
      texture.setPixel(pindex, pixel)
      pindex++
    }
  }
  return texture
}

export function pixelDataToRaw (buffer, format) {
  if (typeof format === 'string') {
    format = getFormat(format)
  }

  if (Array.isArray(buffer)) {
    buffer = Buffer.from(buffer)
  }

  if (format.hasPalette()) {
    // TODO: unnecessary back and forth conversion?
    let out = Array.prototype.slice.call(buffer, 0)
    if (format.bits === 4) {
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
    out = out.concat(data)
  }

  if (format.bits === 2) {
    out = twoToByte(out)
  }

  if (format.bits === 4) {
    out = fourToByte(out)
  }

  return Buffer.from(out)
}
