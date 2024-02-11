import { loadShader, loadTexture, createShader, createProgram, createContext } from './webgl';
import { Animation } from './animation';
import { askForFile, screenshotCanvas, CanvasRecorder } from './file';
import { doubleClick, queryParameters, generateFilename, createElement } from './utils';

import vertexSrc from '/shaders/default.vert?url&raw';
import vertex3Src from '/shaders/default3.vert?url&raw';

async function main({ shader, image, width, height, fps, hide_buttons }) {
  const gl = createContext(width, height);

  const fragSrc = await loadShader(`./shaders/${shader}`)
  const texture = await loadTexture(gl, `./images/${image}`);

  const recorder = new CanvasRecorder(gl.canvas, fps);
  const animation = new Animation;

  draw(gl, fragSrc, texture, animation);

  const filename = () =>
    generateFilename('hypr-shader-preview', shader, image);

  if (!hide_buttons) configureToolbox(gl, recorder, filename);
  configureKeyboardActions(recorder, filename);
  configureClickActions(gl, texture, animation, filename);
}

function configureToolbox(gl, recorder, filename) {
  const screenshotToolbox = createElement({ classList: 'right', children: [
    createElement({
      type: 'button',
      innerText: ' screenshot',
      onclick: function() {
        screenshotCanvas(gl.canvas, filename());
      }
    }),
  ]});

  const recordingToolbox = createElement({ classList: 'left', children: [
    createElement({
      classList: 'timestamp',
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
  ]});

  document.body.append(screenshotToolbox);
  document.body.append(recordingToolbox);
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
      .then(([filename, content]) => {
        draw(gl, content, texture, animation)
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
