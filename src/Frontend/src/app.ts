import { createSSRApp } from 'vue'
import App from './App.vue'
import type { Page, SiteHeaderData, SiteFooterData, NavNode } from './api'
import './style.css'

// The full SSR state: page content plus the CMS-managed site chrome (header/footer/nav).
export interface AppState {
  page: Page | null
  header: SiteHeaderData | null
  footer: SiteFooterData | null
  nav: NavNode[]
}

// Shared app factory used by BOTH entry-server (renderToString) and entry-client (hydrate).
// State fetched during SSR is provided to the tree and re-used on hydration, so the client
// never re-fetches and the markup matches.
export function createApp(state: AppState) {
  const app = createSSRApp(App)
  app.provide<Page | null>('initialPage', state.page)
  app.provide<SiteHeaderData | null>('siteHeader', state.header)
  app.provide<SiteFooterData | null>('siteFooter', state.footer)
  app.provide<NavNode[]>('navTree', state.nav)
  return { app }
}
