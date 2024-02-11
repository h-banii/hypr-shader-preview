# Hypr-shader-preview

This is a WebGL program to preview Hyprland shaders directly in the browser!

It allows you to easily debug, take screenshots, and record your shaders
without having to load them into Hyprland.

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

## Install

To get started, you just need Node.js and a browser capable of running WebGL
(aka almost any modern browser).

```sh
git clone https://github.com/h-banii/hypr-shader-preview.git
cd hypr-shader-preview
npm i
```

## Usage

Start the server then access it in your browser
[http://localhost:5173](http://localhost:5173)

```sh
npm start

  VITE v5.0.12  ready in 144 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

By default it should display an unmodified image (default shader). To run a
custom shader, do the following:

1) copy your shader to `src/public/shaders`
2) open `http://localhost:5173?shader=YOUR_SHADER_NAME_HERE.frag`
3) enjoy

### Query parameters

Configuration is done via optional query parameters

- shader: filename of the shader relative to `src/public/shaders/`
- image: filename of the background image relative to `src/public/images/`
- width: width in pixels of the canvas
- height: height in pixels of the canvas

Here's an example using all of them:

[http://localhost:5173?shader=sakura.frag&image=default.png&width=1920&height=1080](http://localhost:5173?shader=sakura.frag&image=default.png&width=1920&height=1080)

<!-- ### shader -->
<!---->
<!-- This allows you to create a file named `you_shader.frag` inside `src/shaders` -->
<!-- and access its preview on -->
<!---->
<!-- [http://localhost:5173?shader=your_shader.frag](http://localhost:5173?shader=your_shader.frag). -->
<!---->
<!-- ### image -->
<!---->
<!-- If you want to change the background image, just add an image to `src/images` -->
<!-- and pass the filename through the query parameter -->
<!---->
<!-- [http://localhost:5173?image=your_image.jpg](http://localhost:5173?image=your_image.jpg). -->
<!---->
<!-- ### width and height -->
<!---->
<!-- This is useful if you want your preview to have a particular size, like -->
<!-- 1920x1080 -->
<!---->
<!-- By default the canvas tries to occupy your browser window size, but it will not -->
<!-- get dynamically resized if the window changes size after it has already loaded. -->
<!-- (If you want the canvas size to update, just reload the page). -->
<!---->
<!-- [http://localhost:5173?width=1920&height=1080](http://localhost:5173?width=1920&height=1080). -->

##  Take screenshots

Just *click* it!

The screenshot gets saved automatically to your browser's default download
folder.

## Load shaders not located in `src/shaders/`

Just *double-click* it!

It'll open a file input for you to select any fragment shader you want to load.
If it fails, check the console log.

## Recording

Use OBS, you can load it inside a *browser source*

## Version 3.00

WebGL supports version 3.00 of the language, using the `#version 300 es`
directive, and so does this project. But I realized that Hyprland doesn't seem
to support it, or maybe it needs some modification.

So... this is a not very useful feature at the moment, but it's there.

## Limitations

The background image is static. The shaders get applied to a static image, not
to your current display, but that's fine because the goal is just to preview
shaders not to apply it to your actual display. Also, you can just take a
screenshot of your desktop and use it as background image for the shaders.

In the future I might try adding support for video files as background for the
shader, but it's not priority.

An interesting idea would be to record your screen on OBS with a display/window
source then apply the shaders on it. But that requires creating an OBS plugin
and it feels kinda overkill compared to this simple web page that works inside
a regular browser...
