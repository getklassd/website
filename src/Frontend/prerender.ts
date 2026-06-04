// Prerender the site to a fully static dist/client for GitHub Pages (SSG).
//
// GitHub Pages serves static files only — there's no Bun SSR server and no CMS at
// runtime. So we run the same render() the SSR server uses, fetch content from the
// CMS once at build time (CMS_BASE), and bake the HTML + hydration state into
// dist/client/index.html. The client then hydrates from the inlined state and never
// calls the CMS, so the output is self-contained.
//
// Usage (with the CMS running and the client+SSR bundles already built):
//   CMS_BASE=http://localhost:5080 bun run build
//   CMS_BASE=http://localhost:5080 bun prerender.ts
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const clientDir = resolve(root, 'dist/client')

/** Escape `<` so the serialized state can't break out of the inline <script>. */
function serialize(state: unknown): string {
  return JSON.stringify(state ?? null).replace(/</g, '\\u003c')
}

const template = readFileSync(resolve(clientDir, 'index.html'), 'utf-8')
const { render } = (await import(resolve(root, 'dist/server/entry-server.js'))) as typeof import('./src/entry-server')

const { html, state } = await render('/')
const page = template
  .replace('<!--ssr-outlet-->', html)
  .replace('<!--ssr-state-->', serialize(state))

const out = resolve(clientDir, 'index.html')
writeFileSync(out, page)
// SPA fallback so an unknown path (or a refresh) still serves the app.
copyFileSync(out, resolve(clientDir, '404.html'))

if (!state.page) {
  console.error('⚠ Prerendered with NO page content — is the CMS reachable at CMS_BASE?')
  process.exit(1)
}
console.log('✓ Prerendered dist/client/index.html (+ 404.html) with baked-in content')
