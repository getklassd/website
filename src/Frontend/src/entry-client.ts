import { createApp, type AppState } from './app'

// Client entry: read the state the server embedded and hydrate the server-rendered markup.
const fallback: AppState = { route: '/', page: null, header: null, footer: null }
const state = (window as unknown as { __INITIAL_STATE__?: AppState }).__INITIAL_STATE__ ?? fallback
const { app } = createApp(state)
app.mount('#app')
