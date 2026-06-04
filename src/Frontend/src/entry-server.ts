import { renderToString } from 'vue/server-renderer'
import { createApp, type AppState } from './app'
import { fetchHome, getSiteHeader, getSiteFooter } from './api'

// Server entry: fetch page content + CMS-managed chrome (header/footer) in parallel, render the
// app to an HTML string, and return both the markup and the state (serialized for hydration). Each
// fetcher swallows its own errors and returns null so the CMS being unreachable can't fail SSR.
export async function render(_url: string): Promise<{ html: string; state: AppState }> {
  const [page, header, footer] = await Promise.all([
    fetchHome('en').catch(() => null),
    getSiteHeader('en'),
    getSiteFooter('en'),
  ])

  const state: AppState = { page, header, footer }
  const { app } = createApp(state)
  const html = await renderToString(app)
  return { html, state }
}
