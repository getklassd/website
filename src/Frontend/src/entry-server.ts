import { renderToString } from 'vue/server-renderer'
import { createApp } from './app'
import { fetchHome, type Page } from './api'

// Server entry: fetch content from the Klassd delivery API, render the app to an HTML string,
// and return both the markup and the data (serialized into the page for hydration).
export async function render(_url: string): Promise<{ html: string; state: Page | null }> {
  let page: Page | null = null
  try {
    page = await fetchHome('en')
  } catch {
    // CMS unreachable — render the empty state rather than failing the whole request.
  }

  const { app } = createApp(page)
  const html = await renderToString(app)
  return { html, state: page }
}
