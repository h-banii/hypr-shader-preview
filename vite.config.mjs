import { defineConfig } from 'vite'
// import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
  // plugins: [viteSingleFile()],
  root: 'src',
  base: '/hypr-shader-preview/',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})
