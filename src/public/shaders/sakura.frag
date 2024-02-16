// made by h-banii for Hyprland and WebGL

precision mediump float;

varying vec2 v_texcoord;
uniform sampler2D tex;
uniform float time;

#define SAKURA_LAYERS 6.0
#define NUM_SAKURA_PETALS_HOR 1.0
#define NUM_SAKURA_PETALS_VER 1.0
#define OPACITY 0.8
#define INVERSE_SPEED 4.0

const vec2 DIRECTION = vec2(1.0, -6.0);
const vec3 COLOR = vec3(255, 173, 210) / 255.0;

float blurred_sakura_petal(vec2 uv, vec2 diameter) {
  //          / \
  //        /     \
  //      /         \
  // ___/             \___
  vec2 height = 1.0 / diameter;
  vec2 petal = clamp(1.0 - abs(uv - 0.5) * 2.0 * height, 0.0, 1.0);
  return petal.x * petal.y;
}

float sharp_sakura_petal(vec2 uv, vec2 diameter) {
  //      _______
  //     |       |
  //     |       |
  //     |       |
  //_____|       |_____
  vec2 petal = floor(diameter + 1.0 - abs(uv - 0.5) * 2.0);
  return petal.x * petal.y;
}

vec2 grid(vec2 uv, vec2 dim) {
  //         /        /        /        /
  //       /        /        /        /  
  //     /        /        /        /    
  //   /        /        /        /      
  // /        /        /        /        
  return fract(uv * dim);
}

float sakura_grid(vec2 uv, vec2 duv, vec2 dim, vec2 sakura_petal_diam, bool sharp) {
  // add some values vertically so it's harder to see the grid pattern
  uv += fract(vec2(uv.y, uv.x)) * vec2(0.3, 0.5);

  // let's chop our big normalized space into a bunch of "mini normalized spaces"
  // (we'll draw a sakura petal on each "mini space")
  uv = grid(uv, dim);

  // add space dislocation (aka make it move)
  uv = fract(uv + duv + 1.0); 

  if (sharp)
    return sharp_sakura_petal(uv, sakura_petal_diam); 
  return blurred_sakura_petal(uv, sakura_petal_diam); 
}

vec3 screen_blend_mode(vec3 top, vec3 bottom) {
  return 1.0 - (1.0 - top) * (1.0 - bottom);
}

void main() {
  vec2 uv = v_texcoord;
  vec4 pixel = texture2D(tex, v_texcoord);
  vec3 canvas = vec3(0.0, 0.0, 0.0);

  for (float i = 0.0; i < SAKURA_LAYERS; i++) {
    vec2 direction = DIRECTION + i;
    bool is_back_layer = i > 3.0;
    float diameter;

    if (is_back_layer) {
      diameter = 0.1 * clamp(0.8 - abs(fract((time + (i + dot(uv, vec2(2.0, 8.0)))) / 6.0) - 0.5) * 2.0, 0.0, 1.0);
    } else {
      diameter = 0.1;
    }

    float petals = sakura_grid(
      uv,
      vec2(0.2, 0.2) * i + direction * fract(time / (length(direction) * (INVERSE_SPEED + i))),
      vec2(NUM_SAKURA_PETALS_HOR + i, NUM_SAKURA_PETALS_VER + i),
      vec2(diameter),
      is_back_layer
    );

    canvas += vec3(petals, petals, petals);
    pixel.w = max(pixel.w, petals);
  }

  gl_FragColor = vec4(screen_blend_mode(canvas * COLOR * OPACITY, pixel.xyz), pixel.w);
}
