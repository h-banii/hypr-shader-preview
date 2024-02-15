import { GIFEncoder } from '../lib/gif/gifenc.esm.js';
import GIFEncoderWorker from '../lib/gif/worker.js?worker';
import { holdup } from '../utils';

export function askForFile(extension) {
  const input = document.createElement('input');
  input.type = 'file';

  return new Promise((resolve, reject) => {
    input.onchange = inputEvent => {
      const file = inputEvent.target.files[0];

      if (!file) {
        reject(`could not open file`);
        return;
      }

      if (extension && !file.name.includes(extension)) {
        reject(`file name does not contain ${extension}`);
        return;
      }

      resolve(file);
    }

    input.oncancel = () => {
      reject('file input was canceled.');
    }

    input.click();
  });
}

export const readFileAsText = (file) => new Promise((resolve, reject) => { 
  const reader = new FileReader();
  reader.onload = readerEvent => {
    resolve([file.name, readerEvent.target.result]);
  }
  reader.onerror = () => reject(reader.error)
  reader.readAsText(file);
});

export const readFileAsDataURL = (file) => new Promise((resolve, reject) => { 
  const reader = new FileReader();
  reader.onload = readerEvent => {
    resolve([file.name, readerEvent.target.result]);
  }
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(file);
});

function download(filename, url) {
  // https://stackoverflow.com/a/44487883
  const link = document.createElement('a');
  link.setAttribute('download', filename);
  link.setAttribute('href', url);
  link.click();
}

export function screenshotCanvas(canvas, name='hypr-shader-preview-output') {
  const offscreenCanvas = document.createElement('canvas')
  const offscreenContext = offscreenCanvas.getContext('2d');

  offscreenCanvas.width = canvas.width;
  offscreenCanvas.height = canvas.height;

  offscreenContext.drawImage(canvas, 0, 0);

  download(`${name}.png`, offscreenCanvas
    .toDataURL("image/png")
    .replace("image/png", "image/octet-stream")
  )
}

class Timestamp {
  constructor(callback, interval = 1000) {
    this.interval = interval;
    this.intervalId = null;
    this.time = 0;
    this.callback = callback;
  }

  start() {
    if (this.intervalId) return;
    let previousTime = Date.now();
    this.intervalId = setInterval(() => {
      const now = Date.now();
      this.time += now - previousTime;
      previousTime = now;
      this.callback(this.time);
    }, this.interval);
  }

  reset() {
    this.time = 0;
  }

  stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}

class Recorder extends EventTarget {
  #isRecording = false;

  constructor(timestamp) {
    super();
    this.timestamp = timestamp;
  }

  start() {
    console.log(
      `[${new Date().toLocaleString()}] Started recording`
    )
    this.reset();
    this.timestamp.start();
    this.isRecording = true;
  }

  stop() {
    console.log(
      `[${new Date().toLocaleString()}] Stopped recording`
    )
    this.isRecording = false;
    this.timestamp.stop();
  }

  reset() {
    this.timestamp.reset();
    this.dispatchResetEvent();
  }

  /** @abstract */
  save() {}

  get isRecording() {
    return this.#isRecording;
  }

  set isRecording(value) {
    this.#isRecording = value;
    this.dispatchRecordingEvent(this.recording);
  }

  dispatchRecordingEvent(recording) {
    const event = new CustomEvent("recording", { detail: recording || this.isRecording });
    this.dispatchEvent(event);
  }

  dispatchTimestampEvent(timestamp) {
    const event = new CustomEvent("timestamp", { detail: timestamp });
    this.dispatchEvent(event);
  }

  dispatchResetEvent() {
    const event = new Event("reset");
    this.dispatchEvent(event);
  }
}

export class CanvasRecorder extends Recorder {
  constructor(canvas, fps, mbps, mime) {
    super(new Timestamp((time) => {
      this.dispatchTimestampEvent(time)
    }));

    const mimeIsSupported = MediaRecorder.isTypeSupported(mime);

    if (!mimeIsSupported)
      console.log(`Unsupported mime type: ${mime}`)

    this.fps = fps;
    this.mbps = mbps;

    this.chunks = [];
    this.stream = canvas.captureStream(fps);
    this.recorder = new MediaRecorder(this.stream, {
      videoBitsPerSecond: mbps * 1e6,
      mimeType: mimeIsSupported ? mime : '',
    });
    this.width = canvas.width;
    this.height = canvas.height;

    this.recorder.ondataavailable = (e) => this.chunks.push(e.data);
  }

  start() {
    super.start();
    this.recorder.start();
  }

  stop() {
    super.stop();
    this.recorder.stop();
  }

  reset() {
    super.reset();
    this.chunks = [];
  }

  save(filename = 'hypr-shader-preview-video', type = 'video/mp4') { 
    console.log(
`[${new Date().toLocaleString()}] Downloading recording:
filename: ${filename}
fps: ${this.fps}
resolution: ${this.width} x ${this.height}
bitrate: ${this.mbps} mbps;
mime: ${type}`
    )
    const blob = new Blob(this.chunks, { 'type' : type });
    const url = URL.createObjectURL(blob);
    download(filename, url);
  }
}

export class WebGLGifRecorder extends Recorder {
  constructor(gl, fps, numColors, numWorkers) {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const length = width * height * 4;
    const halfLength = length >> 1;
    const row = width * 4;
    const end = (height - 1) * row;
    const delay = 1/fps * 1e3;

    const holdTimestamp = holdup();

    super(new Timestamp((time) => {
      holdTimestamp.next(() => {
        this.dispatchTimestampEvent(time);
      })

      const data = new Uint8ClampedArray(length);

      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);

      for (let i = 0; i < halfLength; i += row) {
        for (let j = 0; j < row; ++j) {
          const tmp = data[i + j];
          data[i + j] = data[end - i + j];
          data[end - i + j] = tmp;
        }
      }

      this.jobs.add(data, width, height, delay);
    }, delay));

    this.fps = fps;
    this.width = width;
    this.height = height;
    this.delay = delay;
    this.numColors = numColors;
    this.numWorkers = numWorkers;
  }

  async start() {
    this.jobs = {
      total: 0,
      done: 0,
      frames: [],
      final: null,
      promise: null,
      cache: null,
      workers: Array.from({ length: this.numWorkers }, () =>
        new GIFEncoderWorker({type: 'module' })
      ),
    };

    this.jobs.promise = new Promise((resolve, reject) => {
      this.jobs.workers.forEach(worker => {
        worker.postMessage({
          width: this.width,
          height: this.height,
          delay: this.delay,
          colors: this.numColors,
        });

        worker.onmessage = e => {
          const [data, frame] = e.data;

          this.jobs.frames[frame] = data;

          if (++this.jobs.done == this.jobs.final) {
            this.jobs.workers.forEach(w => w.terminate())
            this.jobs.workers.length = 0;
            resolve(this.jobs.frames);
          }
        };
      });
    });

    this.jobs.add = (data, width, height, delay) => {
      const worker = this.jobs.workers[this.jobs.total % this.numWorkers];

      worker.postMessage([data, this.jobs.total++], [ data.buffer ])
    }

    this.jobs.stop = () => {
      this.jobs.add = () => {};
      this.jobs.final = this.jobs.total;
    }

    super.start();
  }

  stop() {
    this.jobs.stop();
    super.stop();
  }

  async save(filename) {
    console.log(
`[${new Date().toLocaleString()}] Downloading recording:
filename: ${filename}
fps: ${this.fps}
frames: ${this.jobs.total}
palette: ${this.numColors} colors
web workers: ${this.numWorkers}
resolution: ${this.width} x ${this.height}`
    )

    let cached = this.jobs.cache;

    if (!cached) {
      const gif = GIFEncoder({ auto: false });

      gif.writeHeader();

      const frames = await this.jobs.promise;

      for (const frame in frames) {
        gif.stream.writeBytesView(frames[frame]);
      }

      gif.finish();

      const blob = new Blob([ gif.bytesView() ], { 'type' : 'image/gif' });
      cached = this.jobs.cache = URL.createObjectURL(blob);
    }

    download(filename, cached);
  }
}
