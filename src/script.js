import { loadShader, loadTexture, createShader, createProgram } from './webgl.js';
import { Animation } from './animation';

const url = new URL(window.location.href);
const input = document.createElement('input');
input.type = 'file';

const vertSrc = await loadShader('./shaders/default.vert');
const vert3Src = await loadShader('./shaders/default3.vert');

const selectVertexShader = (frag) => 
  frag.includes('version 300') ? vert3Src : vertSrc;

async function main() {
  const canvas = document.getElementById('shader-canvas');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const gl = canvas.getContext("webgl2");

  if (gl === null) {
    alert("Failed to load WebGL, aw nyo...");
    return;
  }

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.0, 1.0, 1.0, 1.0);

  const shader = url.searchParams.get("shader") || 'default.frag';
  const image = url.searchParams.get("image") || 'default.png';

  const fragSrc = await loadShader(`./shaders/${shader}`)
  const texture = await loadTexture(gl, `./images/${image}`);

  const animation = new Animation;

  start(gl, fragSrc, texture, animation);

  canvas.onclick = () => {
    askForFragmentShader()
      .then(frag => {
        start(gl, frag, texture, animation);
      })
      .catch((e) =>
        console.log(`[${
          new Date().toLocaleString()
        }] Failed to load fragment shader: ${e}`)
      )
  }
}

function askForFragmentShader() {
  return new Promise((resolve, reject) => {
    input.onchange = e => { 
       const file = e.target.files[0]; 

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

    input.oncancel = e => {
      reject('file input was canceled.');
    }

    input.click();
  });
}

function start(gl, fragSrc, texture, animation) {
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
  const numComponents = 2; // pull out 2 values per iteration
  const type = gl.FLOAT; // the data in the buffer is 32bit floats
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set of values to the next
  const offset = 0; // how many bytes inside the buffer to start from
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
  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl[`TEXTURE${unit}`]);
  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(gl.getUniformLocation(program, "tex"), unit);
}

main();
