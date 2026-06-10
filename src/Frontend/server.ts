// Vue SSR server, run by Bun (`bun run server.ts`).
//  • dev  : Vite in middleware mode transforms modules + ssrLoadModule's the server entry.
//  • prod : serves the built client assets (sirv) and imports the compiled SSR bundle.
// node:http is used for the server because Vite's dev middleware is connect-style; Bun is the
// runtime and package manager throughout.
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const isProd = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT ?? 5173)
const root = process.cwd()

type Handler = (req: IncomingMessage, res: ServerResponse) => void

/** Escape `<` so the serialized state can't break out of the inline <script>. */
function serialize(state: unknown): string {
  return JSON.stringify(state ?? null).replace(/</g, '\\u003c')
}

function sendHtml(res: ServerResponse, template: string, html: string, head: string, state: unknown): void {
  const page = template
    .replace('<!--ssr-head-->', head)
    .replace('<!--ssr-outlet-->', html)
    .replace('<!--ssr-state-->', serialize(state))
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(page)
}

async function devHandler(): Promise<Handler> {
  const { createServer: createViteServer } = await import('vite')
  const vite = await createViteServer({
    root,
    appType: 'custom',
    server: { middlewareMode: true },
  })

  return (req, res) => {
    vite.middlewares(req, res, async () => {
      try {
        const url = req.url ?? '/'
        const template = await vite.transformIndexHtml(url, readFileSync(resolve(root, 'index.html'), 'utf-8'))
        const { render } = (await vite.ssrLoadModule('/src/entry-server.ts')) as typeof import('./src/entry-server')
        const { html, head, state } = await render(url)
        sendHtml(res, template, html, head, state)
      } catch (err) {
        vite.ssrFixStacktrace(err as Error)
        res.statusCode = 500
        res.end((err as Error).stack)
      }
    })
  }
}

async function prodHandler(): Promise<Handler> {
  const sirv = (await import('sirv')).default
  const serveStatic = sirv(resolve(root, 'dist/client'), { gzip: true, extensions: [] })
  const template = readFileSync(resolve(root, 'dist/client/index.html'), 'utf-8')
  const { render } = await import(resolve(root, 'dist/server/entry-server.js'))

  return (req, res) => {
    serveStatic(req, res, async () => {
      try {
        const { html, head, state } = await render(req.url ?? '/')
        sendHtml(res, template, html, head, state)
      } catch (err) {
        res.statusCode = 500
        res.end((err as Error).stack)
      }
    })
  }
}

const handler = isProd ? await prodHandler() : await devHandler()
createServer(handler).listen(port, () => {
  console.log(`getklassd.com (Vue SSR) → http://localhost:${port}  [${isProd ? 'prod' : 'dev'}]`)
})
