const input = document.createElement('input');
input.type = 'file';

export function askForFragmentShader() {
  return new Promise((resolve, reject) => {
    input.onchange = inputEvent => {
      const file = inputEvent.target.files[0];

      if (!file.name.includes('frag')) {
        reject('file name does not contain "frag" extension');
        return;
      }

       const reader = new FileReader();
       reader.onload = readerEvent => {
          resolve(readerEvent.target.result);
       }
       reader.readAsText(file,'UTF-8');
    }

    input.oncancel = _ => {
      reject('file input was canceled.');
    }

    input.click();
  });
}
