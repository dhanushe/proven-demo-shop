import { createServer, type Server } from 'node:http'
import type { App } from './app.ts'

/** Serves an app over node:http. Pass port 0 to take any free port. */
export function serve(app: App, port: number): Promise<Server> {
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
    const headers = new Headers()
    for (const [name, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(name, value)
    const response = await app.fetch(new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, { method: req.method, headers, body: hasBody ? Buffer.concat(chunks) : undefined }))
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(Buffer.from(await response.arrayBuffer()))
  })
  return new Promise((resolve) => server.listen(port, () => resolve(server)))
}
