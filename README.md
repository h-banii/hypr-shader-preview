# Hypr-shader-preview

This is a WebGL program to preview Hyprland shaders directly in the browser!

It allows you to easily debug, record, and take screenshots of your shaders
without loading them into Hyprland.

## Install

To get started, you just need Nodejs and a browser.

```sh
git clone https://github.com/h-banii/hypr-shader-preview.git
cd hypr-shader-preview
npm i
```

## Usage

Start the server then open the url in your browser. By default it's on port
[5173](http://localhost:5173)

```sh
npm start

  VITE v5.0.12  ready in 144 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Once the web page loads it *should* an image, which is running the default
shader (do-nothing). To change which shader gets displayed, read the following
sections.

### Query parameters

Configuration is done via query parameters in the URL.

- shader: filename of the shader relative to `src/shaders/`. Ex: default.frag
- image: filename of the background image relative to `src/images/`. Ex: default.png
- width: width in pixels of the canvas. Ex: 1920
- height: height in pixels of the canvas. Ex: 1080

If you are not familiar with query parameters, it starts with `?` and each
parameter is separated by `&`. Here's an example using all of them:

[http://localhost:5173?shader=snow.frag&image=default.png&width=1920&height=1080](http://localhost:5173?shader=snow.frag&image=default.png&width=1920&height=1080)

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

## Debug shaders

If a shader fails to load, check the console log in your browser. Any compilation
errors it encounters are printed there.

## Load shaders located elsewhere

Just *left-click* it!

It'll open a file input for you to select any fragment shader you want to load.
If it fails, check the console log.

##  Take screenshots

Just *right-click* it!

The screenshot gets saved automatically to your browser's default download
folder.

## Recording

Just use OBS, you can load it inside a *browser source*!

## Limitations

The background image is static. The shaders get applied to a static image, not
to your current display, but that's fine because the goal is just to preview
shaders not to actually apply it to your display. Also, you can just take a
screenshot of your desktop and use it as background image for the shaders.

In the future I might try adding support for video files as background for the
shader, but it's not priority.

An interesting idea would be to record your screen on OBS with a display/window
source then apply the shaders on it. But that requires creating an OBS plugin
and it feels kinda overkill compared to this simple web page that works inside
a regular browser...
