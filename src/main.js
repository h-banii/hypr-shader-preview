import { loadShader, loadTexture, createShader, createProgram, createContext } from './webgl';
import { Animation } from './animation';
import { askForFile, screenshotCanvas, CanvasRecorder, WebGLGifRecorder, readFileAsText, readFileAsDataURL } from './file';
import { doubleClick, queryParameters, generateFilename, createElement, createInput } from './utils';

import vertexSrc from '/shaders/default.vert?url&raw';
import vertex3Src from '/shaders/default3.vert?url&raw';

async function main({ shader, image, width, height, fps, mbps, mime, hide_buttons }) {
  console.log(`
shader: ${shader}
image: ${image}
width: ${width}
height: ${height}
fps: ${fps}
mbps: ${mbps}
mime: ${mime}
hide_buttons: ${hide_buttons}
  `)

  const gl = createContext(width, height);

  const fragSrc = await loadShader(`./shaders/${shader}`)
  const texture = await loadTexture(gl, `./images/${image}`);

  const videoRecorder = new CanvasRecorder(gl.canvas, fps, mbps, mime);
  const gifRecorder = new WebGLGifRecorder(gl, fps);
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

  if (hide_buttons) {
    configureClickActions(gl, texture, animation, filename);
    configureKeyboardActions(recorder, filename);
  } else {
    configureButtonActions(gl, fragSrc, texture, animation, gifRecorder, videoRecorder, filename);
  }
}

function configureButtonActions(gl, fragSrc, texture, animation, gifRecorder, videoRecorder, filename) {
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

  const timestampDisplay = (recorder) => createElement({
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
  });

  const recordButton = (recorder, type = '') => createElement({
    type: 'button',
    innerText: `◎ record ${type}`,
    setup: self => {
      self.onclick = function() {
        if (recorder.isRecording) {
          recorder.stop();
          self.style.display = 'none';
        } else {
          recorder.start();
        }
      };
      recorder.addEventListener('recording', e => {
        self.innerText = e.detail ? '◉ stop ' : '◎ record ' + type;
      })
      recorder.addEventListener('reset', e => {
        self.style.display = '';
      })
    },
  });

  const gifButtons = createElement({ children: [
    timestampDisplay(gifRecorder),
    recordButton(gifRecorder, 'gif'),
    createElement({
      style: 'display: none',
      children: [
        createElement({
          type: 'button',
          innerText: 'save',
          onclick: function() {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // flip it on vertex shader
            gifRecorder.save(filename() + 'gif');
          },
        }),
        createElement({
          type: 'button',
          innerText: 'cancel',
          onclick: function() {
            gifRecorder.reset();
          },
        }),
      ],
      setup: self => {
        gifRecorder.addEventListener('recording', e => {
          if (!e.detail) self.style.display = 'inline-block';
          else self.style.display = 'none';
        })
        gifRecorder.addEventListener('reset', () => {
          self.style.display = 'none';
        })
      },
    }),
  ]});

  const mimeTypeInput = createInput({
    type: 'text',
    classList: 'button',
    size: "12",
    value: 'video/mp4',
  });

  const videoButtons = createElement({ children: [
    timestampDisplay(videoRecorder),
    recordButton(videoRecorder, 'video'),
    createElement({
      style: 'display: none',
      children: [
        mimeTypeInput,
        createElement({
          type: 'button',
          innerText: 'save',
          onclick: function() {
            videoRecorder.save(filename(), mimeTypeInput.value);
          },
        }),
        createElement({
          type: 'button',
          innerText: 'cancel',
          onclick: function() {
            videoRecorder.reset();
          },
        }),
      ],
      setup: self => {
        videoRecorder.addEventListener('recording', e => {
          if (!e.detail) self.style.display = 'inline-block';
          else self.style.display = 'none';
        })
        videoRecorder.addEventListener('reset', () => {
          self.style.display = 'none';
        })
      },
    }),
  ]});

  const recordingButtons = createElement({
    classList: 'bottom left',
    children: [
      gifButtons,
      videoButtons,
    ],
  }); 

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
  ].reverse();

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

const isFirefox = typeof InstallTrigger !== 'undefined';

queryParameters(main, {
  "shader" : 'default.frag',
  "image"  : 'default.png',
  "width"  : window.innerWidth,
  "height" : window.innerHeight,
  "fps" : 30,
  "mbps": 26,
  "mime": `video/webm; codecs="${isFirefox ? 'vp8' : 'vp9'}"`,
  "hide_buttons": false,
})
