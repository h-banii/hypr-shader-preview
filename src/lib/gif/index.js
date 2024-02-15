/**
 * Library modified to support WebGL2
 */

export class Gif extends GIF {
  constructor(...args) {
    super(...args);
    this.pixelDataCache = new Uint8ClampedArray(this.options.width * this.options.height * 4);
  }

  getContextData = (gl) => {
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.pixelDataCache);

    const length = this.options.width * this.options.height * 4;
    const row = this.options.width * 4;
    const end = (this.options.height - 1) * row;
    const pixelData = new Uint8ClampedArray(length);

    for (let i = 0; i < length; i += row) {
      for (let j = 0; j < row; ++j) {
        pixelData[i + j] = this.pixelDataCache[end - i + j];
      }
    }

    return pixelData;
  }

  addFrame = function(gl, { delay = 500, copy = false }) {
    const frame = {
      transparent: this.options.transparent,
      delay: delay,
      copy: copy,
    };

    if (frame.copy) {
      frame.data = this.getContextData(gl);
    } else {
      frame.context = gl;
    }

    return this.frames.push(frame);
  }
}
