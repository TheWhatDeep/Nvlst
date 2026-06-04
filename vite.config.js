import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// base: './' keeps asset paths relative, so the static build can be hosted
// anywhere — Cloudflare Pages, GitHub Pages subpaths, or a self-hosted box.
export default defineConfig({
  plugins: [svelte()],
  base: './',
})
