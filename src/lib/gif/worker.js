import { GIFEncoder, quantize, applyPalette } from './gifenc.esm.js';

self.addEventListener('message', (e) => {
  const { frame, data, width, height, delay } = e.data;

  // Quantize your colors to a 256-color RGB palette palette
  const palette = quantize(data, 256);

  // Get an indexed bitmap by reducing each pixel to the nearest color palette
  const index = applyPalette(data, palette);

  // Encode into a single GIF frame chunk
  const gif = GIFEncoder({ auto: false });

  // Write a single frame
  gif.writeFrame(index, width, height, {
    first: frame === 0,
    repeat: 0,
    palette: palette,
    delay: delay,
  });

  const output = gif.bytesView();
  self.postMessage([ output, frame ], [output.buffer]);
})
