import { loadShader, loadTexture, createShader, createProgram, createContext } from './webgl.js';
import { Animation } from './animation';
import { askForFragmentShader, downloadImage } from './file.js';

const vertSrc = await loadShader('./shaders/default.vert');
const vert3Src = await loadShader('./shaders/default3.vert');

const selectVertexShader = (frag) => 
  frag.includes('version 300') ? vert3Src : vertSrc;

async function main() {
  const gl = createContext();

  const url = new URL(window.location.href);
  let shader = url.searchParams.get("shader") || 'default.frag';
  const image = url.searchParams.get("image") || 'default.png';

  const fragSrc = await loadShader(`./shaders/${shader}`)
  const texture = await loadTexture(gl, `./images/${image}`);

  const animation = new Animation;

  draw(gl, fragSrc, texture, animation);

  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('mouseup', e => {
    switch(e.button) {
      case 0:
        askForFragmentShader()
          .then(([filename, content]) => {
            draw(gl, content, texture, animation)
            shader = filename.match('[^/]+.frag')[0] || 'custom';
          })
          .catch((e) => console.log(
            `[${new Date().toLocaleString()}] Failed to load fragment shader: ${e}`
          ))
        break;
      case 2:
        downloadImage(
          gl.canvas,
          `hypr-shader-preview-${shader.replace('.frag', '')}.png`
        );
        break;
    }
  })
}

function draw(gl, fragSrc, texture, animation) {
  animation.stop();

  const vertSrc = selectVertexShader(fragSrc);
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
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const positions = [
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const aPositionLocation = gl.getAttribLocation(program, "a_position");
  const numComponents = 2;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
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

main();
