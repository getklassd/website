import { createSSRApp } from 'vue'
import App from './App.vue'
import type { Page, SiteHeaderData, SiteFooterData } from './api'
import './style.css'

// The full SSR state: page content plus the CMS-managed site chrome (header/footer).
// `route` is the resolved view (e.g. '/' or '/cms/docs') — baked in during prerender so the
// hydrated client renders the same view the server did (no client router needed).
export interface AppState {
  route: string
  page: Page | null
  header: SiteHeaderData | null
  footer: SiteFooterData | null
}

// Shared app factory used by BOTH entry-server (renderToString) and entry-client (hydrate).
// State fetched during SSR is provided to the tree and re-used on hydration, so the client
// never re-fetches and the markup matches.
export function createApp(state: AppState) {
  const app = createSSRApp(App)
  app.provide<string>('route', state.route)
  app.provide<Page | null>('initialPage', state.page)
  app.provide<SiteHeaderData | null>('siteHeader', state.header)
  app.provide<SiteFooterData | null>('siteFooter', state.footer)
  return { app }
}
