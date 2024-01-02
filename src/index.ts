import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import fs from 'node:fs/promises'
import { z } from 'zod'

import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { eq } from 'drizzle-orm/expressions'
import { users } from '../schema'


const app = new Hono()
const db = drizzle(new Database('sqlite.db'))





const schema = z.object({
  filename: z.string(),
  data: z.instanceof(Blob),
})

// http://localhost:3000/2023-12/6Qaa3wstCP.png
app.use('/*', serveStatic({ root: '../../../../../mnt/c/Users/IP/Pictures/ShareX/' }))

app.get('/', (c) => {
  console.log(c.req.url)
  return c.text('Hello Hono!')
})


app.post('/images2', async (c) => {
  const results =  db.select({ name: users.name }).from(users).all()

  const data = await c.req.json()
  console.log(data)
  // console.log(data)

  return c.text('loool')

})

app.post('/images', async (c) => {
  // parse the body
  const body = await c.req.parseBody()
  const { filename, data } = schema.parse(body)

  // find the file
  const dateDir = new Date().toISOString().substring(0, 7)
  const shareXPath = '/mnt/c/Users/IP/Pictures/ShareX'
  const path = `${shareXPath}/${dateDir}/${filename}`
  const exists = await fs.stat(path)
  console.log(`${path}: ${exists.isFile()}, type=${data.type}`)

  // insert image into database
  db.insert(users).values({ name: 'asdf123', email: 'asdf@example.com' }).run()

  return c.text(`${dateDir}/${filename}`)
})



export default app
