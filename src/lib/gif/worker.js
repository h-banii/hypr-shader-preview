import { GIFEncoder, quantize, applyPalette } from './gifenc.esm.js';

self.addEventListener('message', (e) => {
  const { width, height, delay, colors } = e.data;

  const gif = GIFEncoder({ auto: false });

  self.addEventListener('message', (e) => {
    const [ data, frame ] = e.data;

    // Quantize your colors to a 256-color RGB palette palette
    const palette = quantize(data, colors);

    // Get an indexed bitmap by reducing each pixel to the nearest color palette
    const index = applyPalette(data, palette);

    gif.reset();

    // Write a single frame
    gif.writeFrame(index, width, height, {
      first: frame === 0,
      repeat: 0,
      palette: palette,
      delay: delay,
    });

    const output = gif.bytesView();
    self.postMessage([ output, frame ], [output.buffer]);
  });
}, { once: true })
