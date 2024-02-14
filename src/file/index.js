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

export class CanvasRecorder extends EventTarget {
  constructor(canvas, fps) {
    super();

    this.canvas = canvas;
    this.fps = fps;

    this.chunks = [];
    this.stream = canvas.captureStream(fps);
    this.recorder = new MediaRecorder(this.stream);
    this.recording = false;

    this.timestamp = new Timestamp((time) => {
      this.dispatchTimestampEvent(time)
    });

    this.recorder.ondataavailable = (e) => this.chunks.push(e.data);
  }

  start() {
    console.log(
      `[${new Date().toLocaleString()}] Started recording`
    )
    this.reset();
    this.recorder.start();
    this.timestamp.start();
    this.recording = true;
    this.dispatchRecordingEvent(this.recording);
  }

  stop() {
    console.log(
      `[${new Date().toLocaleString()}] Stopped recording`
    )
    this.recorder.stop();
    this.timestamp.stop();
    this.recording = false;
    this.dispatchRecordingEvent(this.recording);
  }

  reset() {
    this.chunks = [];
    this.timestamp.reset();
    this.dispatchResetEvent();
  }

  save(filename = 'hypr-shader-preview-video') {
    const blob = new Blob(this.chunks, { 'type' : 'video/webm' });
    const url = URL.createObjectURL(blob);
    download(filename, url);
    this.reset();
  }

  dispatchRecordingEvent(recording) {
    const event = new CustomEvent("recording", { detail: recording });
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
