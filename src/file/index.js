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

      const reader = new FileReader();
      reader.onload = readerEvent => {
        resolve([file.name, readerEvent.target.result]);
      }
      reader.readAsText(file,'UTF-8');
    }

    input.oncancel = () => {
      reject('file input was canceled.');
    }

    input.click();
  });
}

function download(filename, url) {
  // https://stackoverflow.com/a/44487883
  const link = document.createElement('a');
  link.setAttribute('download', filename);
  link.setAttribute('href', url);
  link.click();
}

export function screenshotCanvas(canvas, name='hypr-shader-preview-output.png') {
  const offscreenCanvas = document.createElement('canvas')
  const offscreenContext = offscreenCanvas.getContext('2d');

  offscreenCanvas.width = canvas.width;
  offscreenCanvas.height = canvas.height;

  offscreenContext.drawImage(canvas, 0, 0);

  download(name, offscreenCanvas
    .toDataURL("image/png")
    .replace("image/png", "image/octet-stream")
  )
}
