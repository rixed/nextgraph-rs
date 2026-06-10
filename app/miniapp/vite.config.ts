import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import wasm from "vite-plugin-wasm";
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  build: {
    // Above the 15 MB wasm file, so it can be embeded (otherwise the embeded worker
    // wouldn't be able to build an URL to fetch it).
    assetsInlineLimit: 20_000_000,
    minify: false,
    sourcemap: 'inline',
  },
  worker: {
    format: 'es',
    plugins: () => [
      wasm(),
      topLevelAwait(),
    ],
  },
  plugins: [
    svelte(),
    topLevelAwait(),
    wasm(),
  ],
})
