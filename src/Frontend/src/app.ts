import { createSSRApp } from 'vue'
import App from './App.vue'
import type { Page } from './api'
import './style.css'

// Shared app factory used by BOTH entry-server (renderToString) and entry-client (hydrate).
// The page data fetched during SSR is provided to the tree and re-used on hydration, so the
// client never re-fetches and the markup matches.
export function createApp(initialPage: Page | null) {
  const app = createSSRApp(App)
  app.provide<Page | null>('initialPage', initialPage)
  return { app }
}
