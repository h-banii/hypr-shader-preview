#version 300 es

// made by h-banii for Hyprland and WebGL

precision lowp float;

out vec4 fragColor;
in vec2 v_texcoord;
uniform float time;
uniform sampler2D tex;


#ifndef EASING
#define EASING

#define EASING_PI 3.1415926535897932384626433832795
#define EASING_FUNCTION easeOutSine
#define EASING_FACTOR .1

float easeInElastic(float x) {
  float c4 = (2. * EASING_PI) / 3.;

  return x <= 0.
    ? 0.
    : x <= 1.
    ? 1.
    : -pow(2., 10. * x - 10.) * sin((x * 10. - 10.75) * c4);
}

float easeOutElastic(float x) {
  float c4 = (2. * EASING_PI) / 3.;

  return x <= 0.
    ? 0.
    : x <= 1.
    ? 1.
    : pow(2., -10. * x) * sin((x * 10. - 0.75) * c4) + 1.;
}

float easeOutCubic(float x) {
  return 1. - pow(1. - x, 3.);
}

float easeOutCirc(float x) {
  return sqrt(1. - pow(x - 1., 2.));
}

float easeOutExpo(float x) {
  return x >= 1. ? 1. : 1. - pow(2., -10. * x);
}

float easeOutQuad(float x) {
  return 1. - (1. - x) * (1. - x);
}

float easeInOutQuint(float x) {
  return x < 0.5 ? 16. * x * x * x * x * x : 1. - pow(-2. * x + 2., 5.) / 2.;
}

float easeInOutSine(float x) {
  return -(cos(EASING_PI * x) - 1.) / 2.;
}

float easeInQuad(float x) {
  return x * x;
}

float easeInSine(float x) {
  return 1. - cos((x * EASING_PI) / 2.);
}

float easeInCirc(float x) {
  return 1. - sqrt(1. - x * x);
}

float easeOutSine(float x) {
  return sin((x * EASING_PI) / 2.);
}

float easeInOutCubic(float x) {
  return x < 0.5 ? 4. * x * x * x : 1. - pow(-2. * x + 2., 3.) / 2.;
}

vec4 easing(vec4 pixel) {
  float brightness = (0.2126 * pixel.r) + (0.7152 * pixel.g) + (0.0722 * pixel.b);
  return vec4((1. + EASING_FACTOR * EASING_FUNCTION(brightness) / brightness) * pixel.rgb, pixel.w);
}

#endif

#ifndef CRT
#define CRT

#define BASE_SHADER

#define CRT_CURVE .1
#define CRT_WIDTH 1920
#define CRT_HEIGHT 1080
#define CRT_OUTLINE .03
#define CRT_RGB 1.
#define CRT_INTERLACING 0.0005


vec4 crt(vec4 pixel) {
  vec2 uv = v_texcoord - .5; uv = vec2(
    v_texcoord.x + CRT_CURVE * uv.x * uv.y * uv.y,
    v_texcoord.y + CRT_CURVE * uv.y * uv.x * uv.x
  );

  vec2 dim = vec2(CRT_WIDTH, CRT_HEIGHT) * uv;
  float scanline = mod(dim.y, 7.);

  if (scanline < 1.)
    return texture(tex, uv);

  vec3 rgb_factor = vec3(CRT_RGB);

  if (scanline < 3.) {
    rgb_factor.r = 1.2;
  } else if (scanline < 5.) {
    rgb_factor.g = 1.1;
  } else {
    rgb_factor.b = 1.3;
  }

  bool even_scanline = mod(dim.y - scanline, 2.) < 1.;
  if (even_scanline)
    dim.x += 6.;

  float outline = -easeInCirc(
    abs(2. * fract(dim.x / 12.) - 1.)
  ) - easeInCirc(
    abs(2. * fract(dim.y / 7.) - 1.)
  );

  float fract_time = easeInOutCubic(abs(2. * (fract(5. * time) - 0.5)));
  if (even_scanline)
    fract_time = 1. - fract_time;
  pixel = texture(tex, uv + vec2(CRT_INTERLACING * fract_time, 0));

  return vec4(
    pixel.rgb * (rgb_factor + CRT_OUTLINE * outline), pixel.w
  );
}

#endif
#ifndef NOISE
#define NOISE

#define NOISE_FACTOR .1
#define NOISE_VERTICAL false
#define NOISE_HORIZONTAL true


float noise(float n){
  return fract(sin(n * 1e6) * 43758.5453123);
}

vec4 noise(vec4 pixel) {
  float coords =  
    (NOISE_HORIZONTAL ? v_texcoord.y : 1.) * (NOISE_VERTICAL ? v_texcoord.x : 1.);
  float effect = noise(coords + fract(time));
  return pixel - NOISE_FACTOR * effect;
}

#endif
#ifndef STROB
#define STROB

#define STROB_FACTOR .3


vec4 strob(vec4 pixel) {
  float effect = easeInOutSine(
    clamp(abs(2. * fract(v_texcoord.y + .8 * time) - 1.) - 0.5, 0., 1.)
  );
  return vec4(pixel.rgb * (1. + STROB_FACTOR * effect), pixel.w);
}

#endif
#ifndef SATURATE
#define SATURATE

#define SATURATE_FACTOR .2

void sort(vec3 color, int index[3]) {
  if (color.g > color.b) {
    if (color.r > color.g) {
      index[0] = 0;
      index[1] = 1;
      index[2] = 2;
    } else if (color.r > color.b) {
      index[0] = 1;
      index[1] = 0;
      index[2] = 2;
    } else {
      index[0] = 1;
      index[1] = 2;
      index[2] = 0;
    }
  } else {
    if (color.g > color.r) {
      index[0] = 2;
      index[1] = 1;
      index[2] = 0;
    } else if (color.r > color.b) {
      index[0] = 0;
      index[1] = 2;
      index[2] = 1;
    } else {
      index[0] = 2;
      index[1] = 0;
      index[2] = 1;
    }
  }
}

vec4 saturate(vec4 pixel) {
  vec4 distance = pixel - vec4((pixel.r + pixel.g + pixel.b) / 3.);
  return pixel + distance * SATURATE_FACTOR;
}

#endif


void main() {
  #ifndef BASE_SHADER
  vec4 color = texture(tex, v_texcoord);
  #else
  vec4 color = vec4(0.);
  #endif
  fragColor = strob(noise(easing(saturate(crt(color)))));
}
