export function createContext(width, height) {
  const canvas = document.createElement('canvas');

  const gl = canvas.getContext("webgl2", {
    preserveDrawingBuffer: true // this allows us to save it to an image
  });

  if (gl === null) {
    alert("Failed to load WebGL, aw nyo...");
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  const resize = (width, height) => {
    canvas.width = width || window.innerWidth;
    canvas.height = height || window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }; resize(width, height);

  if (!width || !height) {
    addEventListener("resize", _event =>
      resize(width, height)
    );
  }

  document.body.appendChild(canvas);

  return gl;
}

export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;

  const error = gl.getShaderInfoLog(shader);
  gl.deleteShader(shader);

  throw new Error(`\n${error.slice(0, error.length - 2)}`);
}

export function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) return program;
 
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}
