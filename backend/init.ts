import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { Hono } from 'hono'
import fs from 'node:fs/promises'
import { z } from 'zod'
import * as schema from '../db/schema'
import { appRouter } from './router'
import { trpcServer } from '@hono/trpc-server'
import { cors } from 'hono/cors'

const app = new Hono()
app.use('/trpc/*', cors())

const port = 3000
const db = drizzle(new Database('db/sqlite.db'), { schema })
const { images, tags } = schema

const reqSchema = z.object({
  filename: z.string(),
  data: z.instanceof(Blob),
})

// http://localhost:3000/2023-12/6Qaa3wstCP.png
// app.use('/*', serveStatic({ root: '../../../../../mnt/c/Users/IP/Pictures/ShareX/' }))
app.use('/*', serveStatic({ root: '../../../../../mnt/c/Users/IP/Pictures/ShareThumbs/' }))

app.get('/', (c) => {
  console.log(c.req.url)
  return c.text('Hello Hono!')
})

app.post('/images2', async (c) => {
  const allTags = db.select().from(tags).all()

  const data = await c.req.json()
  console.log(data)
  // console.log(data)

  return c.text('loool')
})

app.post('/images', async (c) => {
  // parse the body
  const body = await c.req.parseBody()
  const { filename, data } = reqSchema.parse(body)

  // find the file
  const dateDir = new Date().toISOString().substring(0, 7)
  const shareXPath = '/mnt/c/Users/IP/Pictures/ShareX'
  const path = `${shareXPath}/${dateDir}/${filename}`
  const exists = await fs.stat(path)
  console.log(`${path}: ${exists.isFile()}, type=${data.type}`)

  // insert image into database
  // db.insert(user).values({ name: 'asdf123', email: 'asdf@example.com' }).run()

  return c.text(`${dateDir}/${filename}`)
})

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
  })
)

const server = serve({ fetch: app.fetch, port })

console.log(`Server is running on port http://localhost:${port}`)
