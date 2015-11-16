var _           = require('lodash');
var PNGEncoder  = require('png-stream/encoder');

function ffs(x) {
    if (x === 0) return 0;
    var t = 1,
        i = 0;
    while ((x & t) === 0) {
        t <<= 1;
        i++;
    }
    return i;
}

class TextureFormat {
    constructor(data = {}) {
        _.defaults(data, {
            id:             0xFF,
            name:           "null",
            description:    "Unknown format.",
            bits:           8,
            palette:        false,

        });
        this.data = data;

        if (data.mask) {
            var bitwise = {};
            var bits = 0;
            _.each(data.mask, (val, key) => {
                bitwise[key] = {
                    mask: val
                };
                bits = Math.max(bits, (val.toString(16).length/2)*8);
                var i = ffs(val);
                bitwise[key].ffs = i;
                bitwise[key].multiplier = 255/(val>>>i);
            });
            delete this.data.mask;
            this.data.bitwise = bitwise;
            this.data.bits = bits;
        }
    }

    pixelsFromData(d) {
        var pixels = [];
        var data;
        if (this.data.bits < 5) {
            data = [(d&0xF0)>>4, d&0x0F];
        } else {
            data = [d];
        }
        if (this.hasPalette()) {
            return data;
        }
        for (var i = 0, len = data.length; i < len; i++) {
            var colors = [];
            _.each(this.data.bitwise, (bitwise) => {
                colors.push(Math.round(((data[i]&bitwise.mask)>>>bitwise.ffs)*bitwise.multiplier));
            });
            pixels.push(colors);
        }

        return pixels;
    }

    get name() {
        return this.data.name;
    }

    get bytes() {
        return Math.ceil(this.data.bits/8);
    }

    get description() {
        return this.data.description;
    }

    hasPalette() {
        return this.data.palette;
    }

    paletteSize() {
        return Math.pow(2, this.data.bits);
    }

    sizeModifier() {
        return this.data.bits / 8;
    }

    isValid() {
        return this.id !== 0xFF;
    }

    toString() {
        return this.name;
    }
}

var textureFormats = {
    i4: new TextureFormat({
        id: 0x80,
        name: "i4",
        description: "4 bit per pixel. All channels share value.",
        mask: {
            r: 0xF,
            g: 0xF,
            b: 0xF,
            a: 0xF
        }
    }),
    i8: new TextureFormat({
        id: 0x88,
        name: "i8",
        description: "8 bit per pixel. All channels share value.",
        mask: {
            r: 0xFF,
            g: 0xFF,
            b: 0xFF,
            a: 0xFF
        }
    }),
    ia4: new TextureFormat({
        id: 0x60,
        name: "ia4",
        description: "4 bit per pixel. 3 bit for greyscale channel, 1 bit for alpha channel.",
        mask: {
            r: 0xE,
            g: 0xE,
            b: 0xE,
            a: 0x1
        }
    }),
    ia8: new TextureFormat({
        id: 0x68,
        name: "ia8",
        description: "8 bit per pixel. 4 bit for greyscale channel, 4 bit for alpha channel.",
        mask: {
            r: 0xF0,
            g: 0xF0,
            b: 0xF0,
            a: 0x0F
        }
    }),
    ia16: new TextureFormat({
        id: 0x70,
        name: "ia16",
        description: "16 bit per pixel. 8 bit for greyscale channel, 8 bit for alpha channel.",
        mask: {
            r: 0xFF00,
            g: 0xFF00,
            b: 0xFF00,
            a: 0x00FF
        }
    }),
    rgb5a1: new TextureFormat({
        id: 0x10,
        name: "rgb5a1",
        description: "16 bit per pixel. 5 bit per color channel, 1 bit for alpha channel. Also known as rgba16.",
        mask: {
            r: 0xF800,
            g: 0x07C0,
            b: 0x003E,
            a: 0x0001
        }
    }),
    rgba32: new TextureFormat({
        id: 0x18,
        name: "rgba32",
        description: "32 bit per pixel. 8 bit per color channel, 8 bit for alpha channel.",
        mask: {
            r: 0xFF000000,
            g: 0x00FF0000,
            b: 0x0000FF00,
            a: 0x000000FF
        }
    }),
    ci4: new TextureFormat({
        id: 0x40,
        name: "ci4",
        description: "4 bit per pixel. Uses a rgb5a1 palette.",
        bits: 4,
        palette: true
    }),
    ci8: new TextureFormat({
        id: 0x48,
        name: "ci8",
        description: "8 bit per pixel. Uses a rgb5a1 palette.",
        bits: 8,
        palette: true
    }),
    jpeg: new TextureFormat({
        id: 0xFE,
        name: "jpeg",
        description: "Uses the JPEG File Interchange Format (JFIF) standard.",
        bits: 8
    }),
};

function getFormat(format = "") {
    format = format.toLowerCase();
    if (format in textureFormats) {
        return textureFormats[format];
    } else {
        var none = new TextureFormat({name: format});
        return none;
    }
};

class TextureObject {
    constructor(...args) {
        if (args.length == 1) {
            for (var key in args[0]) {
                this[key] = args[0][key];
            }
            return;
        }
        this.palette    = null;
        this.width      = args[0];
        this.height     = args[1];
        this.format     = args[2];
        this.pos        = 0;
        this.data       = [];
        if (!this.format.hasPalette()) {
            this.dataSize = 4;
        } else {
            this.dataSize = 1;
        }
    }

    get length() {
        return this.data.length;
    }

    setPixel(...args) {
        var pos, color;
        if (args.length == 2) {
            pos = args[0];
            color = args[1];
        } else {
            pos = this.pos;
            color = args[0];
        }
        if (!this.format.hasPalette()) {
            if (color.length < 4) {
                color.push(0xFF);
            }
            for (var i = 0, len = color.length; i < len; i++) {
                this.data[pos+i] = color[i];
            }
        } else {
            this.data[pos] = color;
        }
        this.pos = pos+this.dataSize;
    }

    start() {
        this.pos = 0;
    }

    getPixel(pos = this.pos) {
        var out;
        if (!this.format.hasPalette()) {
            out = this.data.slice(pos, pos+this.dataSize);
        } else {
            out = this.data[this.pos];
        }
        this.pos = pos + this.dataSize;
        return out;
    }

    atEnd() {
        return (this.length <= this.pos);
    }

    setPalette(palette) {
        this.palette = palette;
    }

    toBase64() { //Faster conversion, but also lossy!
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = this.width;
        canvas.height = this.height;
        var imageData = ctx.createImageData(this.width, this.height);
        imageData.data.set(this.data);
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
    }

    toPNGBlob(callback) {
        this.toPNGBuffer(function(buffer){
            var out = new Uint8Array(buffer.length);
            for (var i = 0; i < buffer.length; ++i) {
                out[i] = buffer[i];
            }
            var blob = new Blob([out], {type: "image/png"});
            callback(blob);
        });
    }

    toPNGBuffer(callback) {
        var encoder;
        if (!this.format.hasPalette()) {
            encoder = new PNGEncoder(this.width, this.height, {colorSpace: 'rgba'});
        } else {
            encoder = new PNGEncoder(this.width, this.height, {colorSpace: 'indexed', palette: new Buffer(this.palette)});
        }

        var buffers = [];
        encoder.on('data', function(chunk){
            buffers.push(chunk);
        });
        encoder.on('end', function(a){
            var buffer = Buffer.concat(buffers);
            callback(buffer);
        });
        encoder.end(new Buffer(_.flatten(this.data)));
    }
}

module.exports = {
    TextureObject,
    getFormat,
    generateTexture(buffer, format, width, palette) {
        if (typeof format === 'string') {
            format = getFormat(format);
        }
        if ((format.hasPalette() && palette === undefined) ||
            (format == textureFormats.jpeg)) {
            return null;
        }
        if (Array.isArray(buffer)) {
            buffer = new Buffer(buffer);
        }

        var imgBuffer = {
            data:   buffer,
            length: buffer.length,
            pos:    0,
            readUIntBE(byteLength) {
                var data = 0;
                while (byteLength !== 0) {
                    data = (data<<8)|this.data.readUInt8(this.pos);
                    this.pos += 1;
                    byteLength--;
                }
                return data;
            },
            atEnd() {
                return (this.length == this.pos);
            }
        };
        var height = (imgBuffer.length/format.sizeModifier())/width;
        var texture = new TextureObject(width, height, format);
        var data, pixels, i, len;
        if (format.hasPalette()) {
            palette = this.generateTexture(palette, textureFormats.rgb5a1, format.paletteSize()).data;
            texture.setPalette(palette);
        }
        while (!imgBuffer.atEnd()) {
            data = imgBuffer.readUIntBE(format.bytes);
            pixels = format.pixelsFromData(data);
            for (i = 0, len = pixels.length; i < len; i++) {
                texture.setPixel(pixels[i]);
            }
        }
        return texture;
    },

    generateData(texture, format) {

        //var ;
        var textureBuffer = {
            //data:   new Buffer(texture.width*texture.height*4),
            data:   new Buffer(texture.width*texture.height*format.sizeModifier()),
            pos:    0,
            writeUInt8(data) {
                this.data.writeUInt8(data, this.pos);
                //this.data[this.pos] = data;
                this.pos += 1;
            },
            writeUInt16BE(data) {
                //this.data[this.pos]   = (data&0xFF00)>>8;
                //this.data[this.pos+1] = data&0x00FF;
                this.data.writeUInt16BE(data, this.pos);
                this.pos += 2;
            },
        };

        var data, color, red, green, blue, alpha;

        texture.start();
        if (format==textureFormats.rgba32) {
            while(!texture.atEnd()) {
                color   = texture.getPixel();

                textureBuffer.writeUInt8(color[0]);
                textureBuffer.writeUInt8(color[1]);
                textureBuffer.writeUInt8(color[2]);
                textureBuffer.writeUInt8(color[3]);
            }
        } else if (format==textureFormats.rgb5a1) {
            while(!texture.atEnd()) {
                color   = texture.getPixel();

                red     = Math.round(color[0]/(255/31))<<11;
                green   = Math.round(color[1]/(255/31))<<6;
                blue    = Math.round(color[2]/(255/31))<<1;
                alpha   = Math.floor(color[3]/0xFF);
                data    = red+green+blue+alpha;
                textureBuffer.writeUInt16BE(data);
            }
        } else if (format==textureFormats.i4) {
            while(!texture.atEnd()) {
                color       = texture.getPixel();
                var pxOne   = Math.round(color[0]/(255.0/15.0));
                color       = texture.getPixel();
                var pxTwo   = Math.round(color[0]/(255.0/15.0));
                data        = (pxOne<<4)+pxTwo;
                textureBuffer.writeUInt8(data);
            }
        } else if (format==textureFormats.ia4) {
            while(!texture.atEnd()) {
                var pxOne, pxTwo;

                color = texture.getPixel();
                pxOne = Math.round(color[0]/(255.0/7.0))<<1;
                if (color[3] >= 0x80) {
                    pxOne += 0x01;
                } else {
                    pxOne = 0;
                }

                color = texture.getPixel();
                pxTwo = Math.round(color[0]/(255.0/7.0))<<1;
                if (color[3] >= 0x80) {
                    pxTwo += 0x01;
                } else {
                    pxTwo = 0;
                }

                data = (pxOne<<4)+pxTwo;

                textureBuffer.writeUInt8(data);
            }
        } else if (format==textureFormats.i8) {
            while(!texture.atEnd()) {
                color = texture.getPixel();
                textureBuffer.writeUInt8(color[0]);
            }
        } else if (format==textureFormats.ia8) {
            while(!texture.atEnd()) {
                color = texture.getPixel();
                data = (Math.round(color[0]/0x11)<<4)+Math.round(color[3]/0x11);
                textureBuffer.writeUInt8(data);
            }
        } else if (format==textureFormats.ia16) {
            while(!texture.atEnd()) {
                color = texture.getPixel();
                textureBuffer.writeUInt8(color[0]);
                textureBuffer.writeUInt8(color[3]);
            }
        } else if (format==textureFormats.ci8) {
            while(!texture.atEnd()) {
                data = texture.getPixel();
                textureBuffer.writeUInt8(data);
            }
        } else if (format==textureFormats.ci4) {
            while(!texture.atEnd()) {
                var pxOne, pxTwo;

                pxOne = texture.getPixel();
                pxTwo = texture.getPixel();

                data = (pxOne<<4)+pxTwo;
                textureBuffer.writeUInt8(data);
            }
        } else {
            return null;
        }
        return textureBuffer.data;
    }

};
