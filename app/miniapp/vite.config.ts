import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
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
    // No sourcemap. The embedded ~15 MB wasm is inlined as base64 (see
    // assetsInlineLimit above), so the bundled chunk is already ~20 MB. An inline
    // sourcemap on top of that roughly doubles the chunk again and forces the
    // bundler to base64-encode and hold the whole map in memory while rendering.
    // In the (Alpine/musl) docker build, rolldown has no native binding and falls
    // back to its wasm32-wasi binding, which is capped at the 4 GB wasm32 address
    // space; the inline sourcemap pushed chunk rendering past that ceiling
    // ("WebAssembly.Memory.grow(): Maximum memory size exceeded"). Dropping it
    // keeps the build well under the limit.
    sourcemap: false,
  },
  worker: {
    format: 'es',
    plugins: () => [
      wasm(),
      topLevelAwait(),
    ],
  },
  plugins: [
    tailwindcss(),
    svelte(),
    topLevelAwait(),
    wasm(),
  ],
})
