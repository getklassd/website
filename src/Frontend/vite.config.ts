import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// SSR is driven by server.ts (Bun + node:http + Vite middleware mode), so no dev server
// options are needed here — just the Vue plugin for both client and SSR builds.
// `base` is '/' for the custom domain (getklassd.com); override with BASE_PATH
// (e.g. '/website/') when serving from a GitHub project-page URL instead.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [vue()],
})
