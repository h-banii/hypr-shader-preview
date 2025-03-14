import { loadShader, loadTexture, createShader, createProgram, createContext } from './webgl';
import { Animation } from './animation';
import { askForFile, screenshotCanvas, CanvasRecorder, WebGLGifRecorder, readFileAsText, readFileAsDataURL } from './file';
import { doubleClick, queryParameters, generateFilename, createElement, createInput } from './utils';

import vertexSrc from '/shaders/default.vert?url&raw';
import vertex3Src from '/shaders/default3.vert?url&raw';

const Logger = new EventTarget;
Logger.messages = [];

// https://stackoverflow.com/a/11403146
(function() {
  const log = console.log;
  console.log = function () {
    const message = [
      `[${new Date().toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' })}]`,
      ...arguments
    ]
    Logger.messages.push(message);
    Logger.dispatchEvent(new MessageEvent("message", { data: message }));
    log.apply(console, message);
  };
})();

class Program {
  constructor(gl, fragSrc, texture, wl_output = 0) {
    this.gl = gl;

    this.fragSrc = fragSrc;
    this.texture = texture;

    this.animation = new Animation;

    this.wl_output = wl_output;
  }

  setFragSrc(src)  {
    this.fragSrc = src;
  }

  async loadTextureAsync(url)  {
    this.texture = await loadTexture(this.gl, url);
  }

  draw() {
    const gl = this.gl;
    const fragSrc = this.fragSrc;
    const texture = this.texture;
    const animation = this.animation;

    animation.stop();

    const vertSrc = fragSrc.includes('version 300') ? vertex3Src : vertexSrc;
    const vertShader = createShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    const program = createProgram(gl, vertShader, fragShader);

    gl.useProgram(program);

    initSquareBuffer(gl, program);
    initTextureSampler(gl, program, texture);

    const uWlOutputLocation = gl.getUniformLocation(program, "wl_output");
    if (uWlOutputLocation)
      gl.uniform1i(uWlOutputLocation, this.wl_output);

    const uTimeLocation = gl.getUniformLocation(program, "time");
    if (uTimeLocation) {
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
}

async function main({
  shader, image, width, height, wl_output,
  video_fps, video_mbps, video_mime,
  gif_fps, gif_colors, gif_workers,
  hide_buttons
}) {
  console.log(`Query parameters
shader: ${shader}
image: ${image}
width: ${width}
height: ${height}
wl_output: ${wl_output}
video_fps: ${video_fps}
video_mbps: ${video_mbps}
video_mime: ${video_mime}
gif_fps: ${gif_fps}
gif_colors: ${gif_colors}
gif_workers: ${gif_workers}
hide_buttons: ${hide_buttons}`
  )
  const gl = createContext(width, height);

  const fragSrc = await loadShader(`./shaders/${shader}`)
  const texture = await loadTexture(gl, `./images/${image}`);

  const program = new Program(gl, fragSrc, texture, wl_output);

  try {
    program.draw();
  } catch(e) {
    console.log(
      `Failed to load shader.`, e
    );
  }

  const videoRecorder = new CanvasRecorder(gl.canvas, video_fps, video_mbps, video_mime);
  const gifRecorder = new WebGLGifRecorder(gl, gif_fps, gif_colors, gif_workers);

  const filename = () =>
    generateFilename('hypr-shader-preview', shader, image);

  if (hide_buttons) {
    configureClickActions(program, filename);
    configureKeyboardActions(videoRecorder, filename);
  } else {
    configureButtonActions(program, gifRecorder, videoRecorder, filename);
  }
}

function configureButtonActions(program, gifRecorder, videoRecorder, filename) {
  const creditButtons = createElement({ classList: 'bottom right', style: 'width: 550px;', children: [
    createElement({
      classList: 'button',
      style: `
        display: block;
        max-height: 300px;
        position: relative;
      `,
      children: [
        createElement({
          style: `
            display: block;
            font-size: 12px;
            max-height: inherit;
            overflow-y: scroll;
          `,
          innerText: '',
          setup: self => {
            const transform = (msg) => `
              <span style="color: #aaaaff">
                ${msg[0]}
              </span> <span>
                ${msg.slice(1).join(' ').replace(/\n/g, '<br>')}
              </span><br>
            `;
            self.innerHTML = Logger.messages.map(transform).join('<br>')
            Logger.addEventListener('message', e => {
              self.innerHTML = `${self.innerHTML}${transform(e.data)}`;
              self.scrollTop = self.scrollHeight;
              // self.innerText = Logger.messages.join('\n')
            });
          },
        }),
        createElement({
          type: 'button',
          innerText: '',
          style: `
            background: transparent;
            position: absolute;
            padding: 0 10px;
            margin: 8px 20px;
            right: 0;
            top: 0;
          `,
          setup: self => {
            let toggle = false;
            self.onclick = () => {
              self.parentNode.style.maxHeight = toggle ? '200px' : '34px';
              self.innerText = toggle ? '' : '';
              toggle = !toggle;
            }
          }
        })
      ],
    }),
    createElement({
      type: 'button',
      innerText: ' h-banii/hypr-shader-preview',
      style: `
        display: block;
        width: inherit;
      `,
      onclick: function() {
        window.open('https://github.com/h-banii/hypr-shader-preview');
      }
    }),
  ]});

  const fileButtons = createElement({ classList: 'top left', children: [
    createElement({
      type: 'button',
      innerText: ' load image',
      onclick: function() {
        askForFile()
          .then(readFileAsDataURL)
          .then(async ([filename, url]) => {
            console.log(`Loaded background image: ${filename}`)
            return program.loadTextureAsync(url).then(() => program.draw());
          })
          .catch((e) => console.log(`Failed to load background image: ${e}`))
      }
    }),
    createElement({
      type: 'button',
      innerText: ' load shader',
      onclick: function() {
        askForFile('frag')
          .then(readFileAsText)
          .then(([filename, src]) => {
            program.setFragSrc(src);
            program.draw();
            console.log(`Loaded fragment shader: ${filename}`)
          })
          .catch((e) => console.log(`Failed to load fragment shader:\n${e}`))
      }
    }),
  ]});

  const screenshotButtons = createElement({ classList: 'top right', children: [
    createElement({
      type: 'button',
      innerText: ' screenshot',
      onclick: function() {
        screenshotCanvas(program.gl.canvas, filename());
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
      recorder.addEventListener('reset', () => {
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
          setup: self => {
            self.onclick = function() {
              self.disabled = true;
              self.innerText = '...';
              gifRecorder.save(filename())
                .then(() => {
                  self.disabled = false;
                  self.innerText = 'save';
                })
                .catch(() => {
                  console.log('canceled')
                });
            };
          },
        }),
        createElement({
          type: 'button',
          innerText: 'cancel',
          onclick: function() {
            gifRecorder.cancel();
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

function configureClickActions(program, filename) {
  const clickAction = doubleClick(() => {
    screenshotCanvas(program.gl.canvas, filename());
  }, () => {
    askForFile('frag')
      .then(readFileAsText)
      .then(([_filename, src]) => {
        program.setFragSrc(src);
        program.draw();
      })
      .catch((e) => console.log(
        `Failed to load fragment shader: ${e}`
      ))
  }, 500);
  program.gl.canvas.addEventListener('mouseup', () => clickAction.next())
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
  "width"  : null,
  "height" : null,
  "wl_output": 0,
  "video_fps" : 30,
  "video_mbps": 26,
  "video_mime": `video/webm; codecs="${isFirefox ? 'vp8' : 'vp9'}"`,
  "gif_fps": 15,
  "gif_colors": 256,
  "gif_workers": 6,
  "hide_buttons": false,
})
