import { loadShader, loadTexture, createShader, createProgram, createContext } from './webgl';
import { Animation } from './animation';
import { askForFile, screenshotCanvas, CanvasRecorder } from './file';
import { doubleClick, queryParameters, generateFilename } from './utils';

import vertexSrc from '/shaders/default.vert?url&raw';
import vertex3Src from '/shaders/default3.vert?url&raw';

async function main({ shader, image, width, height, fps }) {
  const gl = createContext(width, height);

  const fragSrc = await loadShader(`./shaders/${shader}`)
  const texture = await loadTexture(gl, `./images/${image}`);

  const recorder = new CanvasRecorder(gl.canvas, fps);
  const animation = new Animation;

  draw(gl, fragSrc, texture, animation);

  configureKeyboardActions(recorder, shader, image);
  configureClickActions(gl, texture, animation, shader, image);
}

function configureKeyboardActions(recorder) {
function configureKeyboardActions(recorder, shader, image) {
  document.addEventListener('keyup', e => {
    switch(e.key.toLowerCase()) {
      case 'r':
        if (recorder.recording)
          recorder.stop();
        else
          recorder.start();
        break;
      case 's':
        const filename = generateFilename('hyprshaderpreview', shader, image);
        recorder.save(filename);
        break;
    }
  })
}

function configureClickActions(gl, texture, animation, shader, image) {
  const clickAction = doubleClick(() => {
    screenshotCanvas(gl.canvas, generateFilename('hyprshaderpreview', shader, image));
  }, () => {
    askForFile('frag')
      .then(([filename, content]) => {
        draw(gl, content, texture, animation)
        shader = filename.match('[^/]+.frag')[0] || 'custom';
      })
      .catch((e) => console.log(
        `[${new Date().toLocaleString()}] Failed to load fragment shader: ${e}`
      ))
  }, 500);
  document.addEventListener('mouseup', e => clickAction.next())
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
})
