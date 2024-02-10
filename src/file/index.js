const input = document.createElement('input');
input.type = 'file';

export function askForFile(extension) {
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

const imageCanvas = document.createElement('canvas')
const imageContext = imageCanvas.getContext('2d');
const imageLink = document.createElement('a');

export function downloadImage(canvas, name='hypr-shader-preview-output.png') {
  imageCanvas.width = canvas.width;
  imageCanvas.height = canvas.height;

  imageContext.drawImage(canvas, 0, 0);

  // https://stackoverflow.com/a/44487883
  imageLink.setAttribute('download', name);
  imageLink.setAttribute('href', imageCanvas
    .toDataURL("image/png")
    .replace("image/png", "image/octet-stream")
  );
  imageLink.click();
}
