// made by h-banii for Hyprland and WebGL

precision mediump float;

varying vec2 v_texcoord;
uniform sampler2D tex;
uniform float time;

#define SNOW_LAYERS 6.0
#define NUM_SNOWFLAKES_HOR 1.0
#define NUM_SNOWFLAKES_VER 1.0
#define OPACITY 0.8
#define INVERSE_SPEED 4.0

const vec2 DIRECTION = vec2(1.0, -6.0);
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

float snow_grid(vec2 uv, vec2 duv, vec2 dim, vec2 snowflake_dim, bool sharp) {
  // add some values vertically so it's harder to see the grid pattern
  uv += fract(vec2(uv.y, uv.x)) * vec2(0.3, 0.5);

  // let's chop our big normalized space into a bunch of "mini normalized spaces"
  // (we'll draw a snowflake on each "mini space")
  uv = grid(uv, dim);

  // add space dislocation (aka make it move)
  // space = space + velocity * time = (space + delta_space)
  uv = fract(uv + duv + 1.0); 

  if (sharp)
    return sharp_snowflake(uv, snowflake_dim); 
  return linear_snowflake(uv, snowflake_dim); 
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

    bool is_back_layer = i > 3.0;

    float diameter;
    if (is_back_layer) {
      diameter = 0.1 * clamp(0.8 - abs(fract((time + (i + dot(uv, vec2(2.0, 8.0)))) / 6.0) - 0.5) * 2.0, 0.0, 1.0);
    } else {
      diameter = 0.1;
    }

    float snow = snow_grid(
      uv,
      vec2(0.2, 0.2) * i + direction * fract(time / (length(direction) * (INVERSE_SPEED + i))),
      vec2(NUM_SNOWFLAKES_HOR + i, NUM_SNOWFLAKES_VER + i),
      vec2(diameter),
      is_back_layer
    );

    canvas += vec3(snow, snow, snow);
  }

  gl_FragColor = vec4(screen_blend_mode(canvas * COLOR * OPACITY, color), 1.0);
}
