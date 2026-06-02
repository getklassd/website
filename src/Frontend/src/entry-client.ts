import { createApp } from './app'
import type { Page } from './api'

// Client entry: read the state the server embedded and hydrate the server-rendered markup.
const state = (window as unknown as { __INITIAL_STATE__?: Page | null }).__INITIAL_STATE__ ?? null
const { app } = createApp(state)
app.mount('#app')
