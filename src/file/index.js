import { Gif } from '../lib/gif';

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
    this.timestamp.start();
    this.reset();
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
      `[${new Date().toLocaleString()}] Downloading recording: ${filename}; ${this.fps} fps; ${this.mbps} mbps; ${type}`
    )
    const blob = new Blob(this.chunks, { 'type' : type });
    const url = URL.createObjectURL(blob);
    download(filename, url);
  }
}

export class WebGLGifRecorder extends Recorder {
  constructor(gl, fps, quality = 10) {
    const gif = new Gif({
      workers: 4,
      workerScript: './lib/gif/gif.worker.js',
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      quality: quality,
    });

    const delay = 1/fps * 1e3;

    super(new Timestamp((time) => {
      this.dispatchTimestampEvent(time);
      gif.addFrame(gl, { delay: delay, copy: true });
    }, delay));

    gif.on('finished', (blob) =>  {
      download(this.filename, URL.createObjectURL(blob));
      this.reset();
    });

    this.fps = fps;
    this.recorder = gif;
  }

  reset() {
    super.reset();
    this.recorder.frames = [];
    this.recorder.abort();
  }

  save(filename) {
    console.log(
      `[${new Date().toLocaleString()}] Downloading recording: ${filename}; ${this.fps} fps;`
    )

    this.filename = filename;
    this.recorder.render();
  }
}
