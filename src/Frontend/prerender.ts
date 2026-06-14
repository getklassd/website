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
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const clientDir = resolve(root, 'dist/client')

/** Escape `<` so the serialized state can't break out of the inline <script>. */
function serialize(state: unknown): string {
  return JSON.stringify(state ?? null).replace(/</g, '\\u003c')
}

const template = readFileSync(resolve(clientDir, 'index.html'), 'utf-8')
const { render } = (await import(resolve(root, 'dist/server/entry-server.js'))) as typeof import('./src/entry-server')

/** Render one route and bake the per-route head, HTML and hydration state into the template. */
async function bake(url: string): Promise<{ markup: string; hasPage: boolean }> {
  const { html, head, state } = await render(url)
  const markup = template
    .replace('<!--ssr-head-->', head)
    .replace('<!--ssr-outlet-->', html)
    .replace('<!--ssr-state-->', serialize(state))
  return { markup, hasPage: !!state.page }
}

// Home → index.html (+ 404.html SPA fallback for unknown paths / refreshes).
// The home view is the getklassd.com umbrella landing (static, no CMS content).
const home = await bake('/')
const out = resolve(clientDir, 'index.html')
writeFileSync(out, home.markup)
copyFileSync(out, resolve(clientDir, '404.html'))

// CMS landing → /cms/index.html (CMS-driven content, baked from CMS_BASE at build time).
const cms = await bake('/cms')
mkdirSync(resolve(clientDir, 'cms'), { recursive: true })
writeFileSync(resolve(clientDir, 'cms/index.html'), cms.markup)

// CMS docs → /cms/docs/index.html (static, no CMS content required).
const docs = await bake('/cms/docs')
mkdirSync(resolve(clientDir, 'cms/docs'), { recursive: true })
writeFileSync(resolve(clientDir, 'cms/docs/index.html'), docs.markup)

// Workflows landing → /workflows/index.html (static, no CMS content required).
const workflows = await bake('/workflows')
mkdirSync(resolve(clientDir, 'workflows'), { recursive: true })
writeFileSync(resolve(clientDir, 'workflows/index.html'), workflows.markup)

// Workflows docs → /workflows/docs/index.html (static, no CMS content required).
const workflowsDocs = await bake('/workflows/docs')
mkdirSync(resolve(clientDir, 'workflows/docs'), { recursive: true })
writeFileSync(resolve(clientDir, 'workflows/docs/index.html'), workflowsDocs.markup)

// Auth landing → /auth/index.html (static, no CMS content required).
const auth = await bake('/auth')
mkdirSync(resolve(clientDir, 'auth'), { recursive: true })
writeFileSync(resolve(clientDir, 'auth/index.html'), auth.markup)

// Auth docs → /auth/docs/index.html (static, no CMS content required).
const authDocs = await bake('/auth/docs')
mkdirSync(resolve(clientDir, 'auth/docs'), { recursive: true })
writeFileSync(resolve(clientDir, 'auth/docs/index.html'), authDocs.markup)

if (!cms.hasPage) {
  console.error('⚠ Prerendered /cms with NO page content — is the CMS reachable at CMS_BASE?')
  process.exit(1)
}
console.log('✓ Prerendered index.html (+ 404.html), cms/, cms/docs/, workflows/, workflows/docs/, auth/ and auth/docs/ with baked-in content')
