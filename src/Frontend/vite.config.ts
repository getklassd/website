import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// SSR is driven by server.ts (Bun + node:http + Vite middleware mode), so no dev server
// options are needed here — just the Vue plugin for both client and SSR builds.
export default defineConfig({
  plugins: [vue()],
})
