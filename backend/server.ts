import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Server as HTTPServer } from 'node:http'
import { WebSocket, WebSocketServer } from 'ws'
import { z } from 'zod'
import { image } from '../db/db-handlers'
import { appRouter } from './router'

//  =================================
//              HONO+TRPC
//  =================================

const port = 3000
const app = new Hono()
let websocket: WebSocket

app.use('/trpc/*', cors())
app.use('/trpc/*', trpcServer({ router: appRouter }))

//  =====================================
//              IMAGE SERVING
//  =====================================

// http://localhost:3000/2023-12/6Qaa3wstCP.png
app.use('/thumbs/*', serveStatic({
  root: '../../../../../mnt/c/Users/IP/Pictures/ShareThumbs/',
  rewriteRequestPath: (path) => path.replace(/^\/thumbs/, '/'),
}))

app.use('/full/*', serveStatic({
  root: '../../../../../mnt/c/Users/IP/Pictures/ShareX/',
  rewriteRequestPath: (path) => path.replace(/^\/full/, '/'),
}))

//  ==================================
//              API ROUTES
//  ==================================

app.get('/', (c) => {
  console.log(c.req.url)
  return c.text('Hello Hono!')
})

const imageSchema = z.object({
  filename: z.string(),
  data: z.instanceof(Blob),
})

app.post('/images', async (c) => {
  // note -> using filename only for now, discarding body
  try {
    const body = await c.req.parseBody()
    const { filename, data } = imageSchema.parse(body)
    const dbResult = await image.addImage(filename)

    websocket?.send(JSON.stringify({
      data: `SOCKET: inserted id is ${dbResult.lastInsertRowid}`,
      id: dbResult.lastInsertRowid
    }))

    return c.text(`Inserted ${dbResult.lastInsertRowid} into db.`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    return c.text(msg)
  }
})

//  ===================================
//              INIT SERVER
//  ===================================

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`)
})

//  ==================================
//              WEBSOCKETS
//  ==================================

const wss = new WebSocketServer({ server: server as HTTPServer })

wss.on('connection', function connection(ws) {
  websocket = ws

  ws.on('error', console.error)

  ws.on('message', function message(data) {
    console.log('received: %s', data)
  })
})
