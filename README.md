# Hypr-shader-preview

This is a WebGL program to preview Hyprland shaders directly in the browser!
You can try it out [here](https://h-banii.github.io/hypr-shader-preview/?shader=sakura.frag)

It allows you to easily debug, take screenshots, and record your shaders
without having to load them into Hyprland.

<img src="https://github.com/h-banii/hypr-shader-preview/assets/121690516/6a28eb70-6e62-44c6-b09e-fc568a723755" width="800"/>

## Demo

<details>
  <summary>Sakura petals</summary>
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

## Supported variables

It uses the same variable names that Hyprland expects, so you *probably* don't
need to modify your hyprland shaders, they're likely already compatible.

```glsl
varying vec2 v_texcoord
uniform sampler2D tex
uniform float time
```

I'm not sure what other variables Hyprland supports, but those 3 seems to be
enough to run all shaders I've seen so far. Open an issue if you know another
variable, I'll look into it.

## Debug shaders

Compilation errors are printed in the browser's console log.

## Usage

### Quick start

Go to [https://h-banii.github.io/hypr-shader-preview](https://h-banii.github.io/hypr-shader-preview) and enjoy!

### For developers (preferred)

To get started, clone the repository and install the dependencies.
The only requirement is [Node.js](https://nodejs.org/en)

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

<image width="400" src="https://github.com/h-banii/hypr-shader-preview/assets/121690516/a84cf1ca-52b5-4039-8e32-c0e6df1d2585" />

### Query parameters

- shader: filename of the shader relative to `src/public/shaders/`
- image: filename of the background image relative to `src/public/images/`
- width: width in pixels of the canvas
- height: height in pixels of the canvas
- hide_buttons: hides buttons (useful if you want to record it on OBS, for example)
- fps: changes fps used to record the canvas

Here's an example using all of them:

[http://localhost:5173?shader=sakura.frag&image=default.png&width=1920&height=1080&hide_buttons=true&fps=60](http://localhost:5173?shader=sakura.frag&image=default.png&width=1920&height=1080&hide_buttons=true&fps=60)

## Version 3.00

WebGL supports version 3.00 of the language, using the `#version 300 es`
directive, and so does this project. But I realized that Hyprland doesn't seem
to support it, or maybe it needs some modification.

So... this is a not very useful feature at the moment, but it's there.

## Limitations

### Background image

The background image is static. The shaders get applied to a static image, not
to your current display, but that's fine because the goal is just to preview
shaders not to apply it to your actual display. Also, you can just take a
screenshot of your desktop and use it as background image for the shaders.

In the future I might try adding support for video files as background for the
shader, but it's not priority.

### Recording

The built-in recorder has really low quality (w3c/mediacapture-record#57), but
you can bypass that by simply using another screen recorder like OBS (load it
inside a *browser source* and set the `hide_buttons` query parameter to true).

An interesting idea that doesn't use WebGL would be to record your screen on
OBS with a display/window source then apply the shaders on it. But that
requires creating an OBS plugin and it feels kinda overkill compared to this
simple web page that works inside a regular browser...

# Goals

- [X] Compile and run Hyprland shaders
- [X] Take screenshots in the browser
- [X] Record videos in the browser
- [X] Show buttons on the screen
- [X] Deploy to GitHub Pages
- [ ] Record gifs in the browser
