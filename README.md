# Hypr-shader-preview

This is a WebGL program to preview Hyprland shaders directly in the browser!
You can try it out [here](https://h-banii.github.io/hypr-shader-preview/?shader=sakura.frag)

It allows you to easily debug, take screenshots, and record your shaders
without having to load them into Hyprland.

<image width="800" src="https://github.com/user-attachments/assets/fdbee136-5649-46a1-ae19-1efcb65d2908" />

### Demo

<details>
  <summary>Sakura petals video</summary>
  <p>
    <video src="https://github.com/h-banii/hypr-shader-preview/assets/121690516/35cccd25-f6ae-46e5-a3bb-96112e3d35ff">
    </video>
    <em>
      anime: <a href="https://www.crunchyroll.com/series/GY5V74MPY/citrus">Citrus</a><br>
      wallpaper: <a href="https://www.reddit.com/r/CitrusManga/comments/8vjcpe/">reddit</a><br>
      music: <a href="https://youtu.be/-nmeHZ8rOd8?si=_fZFE2syWFt0SVdL">さりい bgm (YouTube)</a>, <a href="https://twitter.com/sarixbgm">sarixbgm (twitter)</a>
    </em>
  </p>
</details>

<details>
  <summary>Sakura petals gif</summary>
  <p>
    <img src="https://github.com/h-banii/hypr-shader-preview/assets/121690516/92f9f9f6-573a-4ce0-9e12-ec68c9afcf27" width="800"/><br>
    <em>
      art: h-banii (<a href="https://twitter.com/h_banii">twitter</a>) (<a href="https://www.pixiv.net/en/users/56018062">pixiv</a>)
    </em>
  </p>
</details>


### Supported variables

It uses the same variable names that Hyprland expects, so you *probably* don't
need to modify your hyprland shaders, they're likely already compatible.

```glsl
// Supported
varying vec2 v_texcoord
uniform sampler2D tex
uniform float time

// Not supported, but planning to add
uniform int wl_output
```

### Debug shaders

Compilation errors are printed in the browser's console log.

# Requirements

You need a browser with WebGL support and hardware acceleration activated (otherwise it'll use your CPU).

If you wish to install and use it locally, you'll need [Node.js](https://nodejs.org/en).

# Usage

### GitHub Pages

Go to [https://h-banii.github.io/hypr-shader-preview](https://h-banii.github.io/hypr-shader-preview) and enjoy!

### Locally (preferred)

To get started, clone the repository and install the dependencies.

```sh
git clone https://github.com/h-banii/hypr-shader-preview.git
cd hypr-shader-preview
npm i
```

Then start the server and access it in your browser
[http://localhost:5173](http://localhost:5173)

```sh
npm start

  VITE v5.0.12  ready in 144 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Buttons

- load background image
- load fragment shader (frag)
- take screenshot (png)
- record video (mp4, webm)
- record gif

### Query parameters

- shader: filename of the shader relative to `src/public/shaders/`
- image: filename of the background image relative to `src/public/images/`
- width: width in pixels of the canvas
- height: height in pixels of the canvas
- video_fps: fps used to record videos
- video_mbps: bitrate (mbps) used to record videos
- video_mime: mime type used to record videos
- gif_fps: fps used to record gifs
- gif_colors: maximum number of colors used to record gifs
- gif_workers: number of web workers used to encode the gif data
- hide_buttons: hides buttons (useful if you want to record it on OBS, for example)

Here's an example using some of them:

[http://localhost:5173?shader=sakura.frag&image=default.png&width=1920&height=1080&hide_buttons=true](http://localhost:5173?shader=sakura.frag&image=default.png&width=1920&height=1080&hide_buttons=true)

## Version 3.00

WebGL supports version 3.00 of the language, using the `#version 300 es`
directive, and so does this project. But I realized that Hyprland doesn't seem
to support it, or maybe it needs some modification.

So... this is a not very useful feature at the moment, but it's there.

# Limitations

### Background image

The background image is static. The shaders get applied to a static image, not
to your current display, but that's fine because the goal is just to preview
shaders not to apply it to your actual display. Also, you can just take a
screenshot of your desktop and use it as background image for the shaders.

In the future I might try adding support for video files as background for the
shader, but it's not priority.

### Recording

The built-in recorder is kinda bad, but that's not a big deal... you can use
any third party screen recorder, like OBS, to record it (just set the
`hide_buttons` query parameter to true and load it inside a *browser source*!).

An interesting idea that doesn't use WebGL would be to record your screen on
OBS with a display/window source then apply the shaders on it. But that
requires creating an OBS plugin and it feels kinda overkill compared to this
simple web page that works inside a regular browser...

# Scripts

There are 2 scripts inside the scripts/ folder: `install.sh` and `apply.sh`

## `install.sh`

This moves the file `sakura.frag` from `./src/public/shaders` to
`~/.config/hypr/shaders`
```sh
./scripts/install.sh sakura
```

## `apply.sh`

This applies the `~/.config/hypr/shaders/sakura.frag` shader and automatically
activates damage_tracking if needed (i.e. if it uses **time**).
```sh
./scripts/apply.sh on sakura
```

This turns off the shader and deactivates damage_tracking.
```sh
./scripts/apply.sh off
```

You can also give the path to the shader file.
```sh
./scripts/apply.sh on ~/.config/hypr/shaders/sakura.frag
./scripts/apply.sh on ./src/public/shaders/sakura.frag
```

# Goals

- [X] Compile and run Hyprland shaders
- [X] Take screenshots in the browser
- [X] Record videos in the browser
- [X] Show buttons on the screen
- [X] Deploy to GitHub Pages
- [X] Record gifs in the browser
- [X] Resize canvas when window resizes
- [ ] Allow video as background
- [ ] uniform int wl_output
