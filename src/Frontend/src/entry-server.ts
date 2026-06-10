import { renderToString } from 'vue/server-renderer'
import { createApp, type AppState } from './app'
import { fetchHome, getSiteHeader, getSiteFooter } from './api'

/** Map a request URL to a known view. Everything that isn't a known static view renders home. */
function resolveRoute(url: string): string {
  const path = (url.split('?')[0] || '/').replace(/\/+$/, '') || '/'
  if (path === '/docs') return '/docs'
  if (path === '/workflows') return '/workflows'
  return '/'
}

// Server entry: resolve the route, fetch the CMS-managed chrome (header/footer) in parallel, and —
// for the home view only — the page content. Render to an HTML string and return it with the state
// (serialized for hydration). Each fetcher swallows its own errors and returns null so the CMS being
// unreachable can't fail SSR.
export async function render(url: string): Promise<{ html: string; state: AppState }> {
  const route = resolveRoute(url)
  const [page, header, footer] = await Promise.all([
    route === '/' ? fetchHome('en').catch(() => null) : Promise.resolve(null),
    getSiteHeader('en'),
    getSiteFooter('en'),
  ])

  const state: AppState = { route, page, header, footer }
  const { app } = createApp(state)
  const html = await renderToString(app)
  return { html, state }
}
