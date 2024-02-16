export function loadShader(url) {
  return fetch(url)
    .then(response => response.text())
}

export function loadTexture(gl, url) {
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = function() {
      const texture = gl.createTexture();

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // flip it on vertex shader

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        this,
      );

      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      resolve(texture);
    };
    image.onerror = () => {
      reject('probably not an image');
    }
    image.src = url;
  });
}
