import { defineConfig } from 'vite'
// import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
  // plugins: [viteSingleFile()],
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})
