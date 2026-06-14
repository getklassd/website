import { renderToString } from 'vue/server-renderer'
import { createApp, type AppState } from './app'
import { fetchHome, getSiteHeader, getSiteFooter } from './api'
import { renderHead } from './seo'

/** Map a request URL to a known view. Everything that isn't a known static view renders home. */
function resolveRoute(url: string): string {
  const path = (url.split('?')[0] || '/').replace(/\/+$/, '') || '/'
  if (path === '/cms/docs') return '/cms/docs'
  if (path === '/cms') return '/cms'
  if (path === '/workflows/docs') return '/workflows/docs'
  if (path === '/workflows') return '/workflows'
  if (path === '/auth/docs') return '/auth/docs'
  if (path === '/auth') return '/auth'
  return '/'
}

// Server entry: resolve the route, fetch the CMS-managed chrome (header/footer) in parallel, and —
// for the CMS landing view only — the page content. Render to an HTML string and return it with the
// state (serialized for hydration) and the per-route <head> markup. Each fetcher swallows its own
// errors and returns null so the CMS being unreachable can't fail SSR.
export async function render(url: string): Promise<{ html: string; head: string; state: AppState }> {
  const route = resolveRoute(url)
  const [page, header, footer] = await Promise.all([
    route === '/cms' ? fetchHome('en').catch(() => null) : Promise.resolve(null),
    getSiteHeader('en'),
    getSiteFooter('en'),
  ])

  const state: AppState = { route, page, header, footer }
  const { app } = createApp(state)
  const html = await renderToString(app)
  return { html, head: renderHead(route), state }
}
