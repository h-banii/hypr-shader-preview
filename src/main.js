import { loadShader, loadTexture, createShader, createProgram, createContext } from './webgl';
import { Animation } from './animation';
import { askForFile, screenshotCanvas, CanvasRecorder, readFileAsText, readFileAsDataURL } from './file';
import { doubleClick, queryParameters, generateFilename, createElement } from './utils';

import vertexSrc from '/shaders/default.vert?url&raw';
import vertex3Src from '/shaders/default3.vert?url&raw';

async function main({ shader, image, width, height, fps, hide_buttons }) {
  const gl = createContext(width, height);

  const fragSrc = await loadShader(`./shaders/${shader}`)
  const texture = await loadTexture(gl, `./images/${image}`);

  const recorder = new CanvasRecorder(gl.canvas, fps);
  const animation = new Animation;

  try {
    draw(gl, fragSrc, texture, animation);
  } catch(e) {
    console.log(
      `[${new Date().toLocaleString()}] Failed to load shader.`
    );
  }

  const filename = () =>
    generateFilename('hypr-shader-preview', shader, image);

  if (hide_buttons) 
    configureClickActions(gl, texture, animation, filename);
  else
    configureButtonActions(gl, fragSrc, texture, animation, recorder, filename);
  configureKeyboardActions(recorder, filename);
}

function configureButtonActions(gl, fragSrc, texture, animation, recorder, filename) {
  const creditButtons = createElement({ classList: 'top right', children: [
    createElement({
      type: 'button',
      innerText: ' h-banii/hypr-shader-preview',
      onclick: function() {
        window.open('https://github.com/h-banii/hypr-shader-preview');
      }
    }),
  ]});

  const fileButtons = createElement({ classList: 'top left', children: [
    createElement({
      type: 'button',
      innerText: ' load image',
      onclick: function() {
        askForFile()
          .then(readFileAsDataURL)
          .then(async ([filename, url]) => {
            texture = await loadTexture(gl, url);
            draw(gl, fragSrc, texture, animation)
            return filename;
          })
          .then((filename) => console.log(
            `[${new Date().toLocaleString()}] Loaded background image: ${filename}`
          ))
          .catch((e) => console.log(
            `[${new Date().toLocaleString()}] Failed to load background image: ${e}`
          ))
      }
    }),
    createElement({
      type: 'button',
      innerText: ' load shader',
      onclick: function() {
        askForFile('frag')
          .then(readFileAsText)
          .then(([filename, src]) => {
            fragSrc = src;
            draw(gl, fragSrc, texture, animation)
            return filename;
          })
          .then((filename) => console.log(
            `[${new Date().toLocaleString()}] Loaded fragment shader: ${filename}`
          ))
          .catch((e) => console.log(
            `[${new Date().toLocaleString()}] Failed to load fragment shader: ${e}`
          ))
      }
    }),
  ]});

  const screenshotButtons = createElement({ classList: 'bottom right', children: [
    createElement({
      type: 'button',
      innerText: ' screenshot',
      onclick: function() {
        screenshotCanvas(gl.canvas, filename());
      }
    }),
  ]});

  const recordingButtons = createElement({ classList: 'bottom left', children: [
    createElement({
      classList: 'button',
      innerText: '00:00',
      setup: self => {
        recorder.addEventListener('timestamp', e => {
          if (self.style.display == 'none') self.style.display = `inline-block`;
          self.innerText = new Date(e.detail).toLocaleString('en-GB', {
            minute: '2-digit',
            second: '2-digit',
            timezone: 'UTC'
          });
        })
        recorder.addEventListener('reset', () => {
          self.innerText = '00:00';
        })
      },
    }),
    createElement({
      type: 'button',
      innerText: '◎ record',
      onclick: function() {
        if (recorder.recording) {
          recorder.stop();
        } else {
          recorder.start();
        }
      },
      setup: self => {
        recorder.addEventListener('recording', e => {
          self.innerText = e.detail ? '◉ stop' : '◎ record';
        })
      },
    }),
    createElement({
      type: 'button',
      innerText: 'save',
      style: 'display: none',
      onclick: function() {
        recorder.save(filename());
      },
      setup: self => {
        recorder.addEventListener('recording', e => {
          const recording = e.detail;
          if (!recording) {
            self.style.display = '';
          } else {
            self.style.display = 'none';
          }
        })
        recorder.addEventListener('reset', () => {
          self.style.display = 'none';
        })
      },
    }),
    createElement({
      classList: 'button',
      style: 'display: inline-block',
      innerText: '(this is low quality, see README for alternative)'
    })
  ]});

  document.body.append(creditButtons);
  document.body.append(fileButtons);
  document.body.append(screenshotButtons);
  document.body.append(recordingButtons);
}

function configureKeyboardActions(recorder, filename) {
  document.addEventListener('keyup', e => {
    switch(e.key.toLowerCase()) {
      case 'r':
        if (recorder.recording)
          recorder.stop();
        else
          recorder.start();
        break;
      case 's':
        recorder.save(filename());
        break;
    }
  })
}

function configureClickActions(gl, texture, animation, filename) {
  const clickAction = doubleClick(() => {
    screenshotCanvas(gl.canvas, filename());
  }, () => {
    askForFile('frag')
      .then(readFileAsText)
      .then(([filename, src]) => {
        draw(gl, src, texture, animation)
      })
      .catch((e) => console.log(
        `[${new Date().toLocaleString()}] Failed to load fragment shader: ${e}`
      ))
  }, 500);
  gl.canvas.addEventListener('mouseup', e => clickAction.next())
}

function draw(gl, fragSrc, texture, animation) {
  animation.stop();

  const vertSrc = fragSrc.includes('version 300') ? vertex3Src : vertexSrc;
  const vertShader = createShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = createProgram(gl, vertShader, fragShader);

  gl.useProgram(program);

  initSquareBuffer(gl, program);
  initTextureSampler(gl, program, texture);

  if (fragSrc.includes('time')) {
    const uTimeLocation = gl.getUniformLocation(program, "time");

    animation.render = (time) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTimeLocation, time);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    };

    animation.start();
  } else {
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }
}

function initSquareBuffer(gl, program) {
  const buffer = gl.createBuffer();

  const positions = [
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0
  ];

  const aPositionLocation = gl.getAttribLocation(program, "a_position");
  const numComponents = 2;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.vertexAttribPointer(
    aPositionLocation,
    numComponents,
    type,
    normalize,
    stride,
    offset,
  );
  gl.enableVertexAttribArray(aPositionLocation);
}

function initTextureSampler(gl, program, texture, unit=0) {
  gl.activeTexture(gl[`TEXTURE${unit}`]);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(gl.getUniformLocation(program, "tex"), unit);
}

queryParameters(main, {
  "shader" : 'default.frag',
  "image"  : 'default.png',
  "width"  : window.innerWidth,
  "height" : window.innerHeight,
  "fps" : 30,
  "hide_buttons": false,
})
