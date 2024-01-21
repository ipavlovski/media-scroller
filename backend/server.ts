import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { image } from '../db/db-handlers'
import { appRouter } from './router'

//  =================================
//              HONO+TRPC
//  =================================

const port = 3000
const app = new Hono()
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
  // note -> using filename only for now, discarding
  try {
    // parse the body
    const body = await c.req.parseBody()
    const { filename, data } = imageSchema.parse(body)
    // console.log(`${path}: ${exists.isFile()}, type=${data.type}`)
    const dbResult = await image.addImage(filename)
    return c.text(`Inserted ${dbResult.lastInsertRowid} into db.`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    return c.text(msg)
  }
})

//  ===================================
//              INIT SERVER
//  ===================================

serve({ fetch: app.fetch, port })
console.log(`Server is running on port http://localhost:${port}`)
