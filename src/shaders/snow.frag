// made by h-banii for Hyprland and WebGL

precision mediump float;

varying vec2 v_texcoord;
uniform sampler2D tex;
uniform float time;

#define SNOW_LAYERS 6.0
#define NUM_SNOWFLAKES_HOR 4.0
#define NUM_SNOWFLAKES_VER 2.0
#define OPACITY 0.8
#define INVERSE_SPEED 6.0

const vec2 DIRECTION = vec2(1.0, -3.0);
const vec3 COLOR = vec3(255, 173, 210) / 255.0;

float linear_snowflake(vec2 uv, vec2 diameter) {
  //          / \
  //        /     \
  //      /         \
  // ___/             \___
  vec2 height = 1.0 / diameter;
  vec2 flake = clamp(1.0 - abs(uv - 0.5) * 2.0 * height, 0.0, 1.0);
  return flake.x * flake.y;
}

float sharp_snowflake(vec2 uv, vec2 diameter) {
  //      _______
  //     |       |
  //     |       |
  //     |       |
  //_____|       |_____
  vec2 flake = floor(diameter + 1.0 - abs(uv - 0.5) * 2.0);
  return flake.x * flake.y;
}

vec2 grid(vec2 uv, vec2 dim) {
  //         /        /        /        /
  //       /        /        /        /  
  //     /        /        /        /    
  //   /        /        /        /      
  // /        /        /        /        
  return fract(uv * dim);
}

float snow_grid(vec2 uv, vec2 duv, vec2 dim, vec2 snowflake_dim) {
  // add some values vertically so it's harder to see the grid pattern
  uv.y += fract(uv.x) * 0.5;

  // let's chop our big normalized space into a bunch of "mini normalized spaces"
  // (we'll draw a snowflake on each "mini space")
  uv = grid(uv, dim);

  // uv.y = (uv.y - 0.5) * 1.0 - abs(fract(time) - 0.5) * 2.0;

  // add space dislocation (aka make it move)
  // space = space + velocity * time = (space + delta_space)
  uv = fract(uv + duv + 1.0); 

  // swap it with sharp_snowflake or make your own snowflake function
  return sharp_snowflake(uv, snowflake_dim); 
}

vec3 screen_blend_mode(vec3 top, vec3 bottom) {
  return 1.0 - (1.0 - top) * (1.0 - bottom);
}

void main() {
  vec2 uv = v_texcoord;
  vec3 color = texture2D(tex, v_texcoord).xyz;
  vec3 canvas = vec3(0.0, 0.0, 0.0);

  for (float i = 0.0; i < SNOW_LAYERS; i++) {
    vec2 direction = DIRECTION + i;

    // dynamic diameter
    float diameter = 0.05 * clamp(0.9 - abs(fract((time + (i + uv.x)) / 6.0) - 0.5) * 2.0, 0.0, 1.0);

    // fixed diameter
    // float diameter = 0.05;

    float snow = snow_grid(
      uv,
      vec2(0.2, 0.2) * i + direction * fract(time / (length(direction) * (INVERSE_SPEED + i))),
      vec2(NUM_SNOWFLAKES_HOR + i, NUM_SNOWFLAKES_VER + i),
      vec2(diameter, diameter)
    );

    canvas += vec3(snow, snow, snow);
  }

  gl_FragColor = vec4(screen_blend_mode(canvas * COLOR * OPACITY, color), 1.0);
}
