#version 300 es

precision mediump float;

in vec2 v_texcoord;

uniform sampler2D tex;

void main() {
  gl_FragColor = texture2D(tex, v_texcoord);
}
