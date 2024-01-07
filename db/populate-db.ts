import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { DateTime } from 'luxon'
import * as schema from './schema'
// import data from './sqlite.json'

const { images, tags, categories, metadata, imagesToTags } = schema
const db = drizzle(new Database('./db/sqlite.db'), { schema })

async function populateImages(data: any) {
  for (const image of data) {
    console.log(image.id)
    const d = DateTime.fromMillis(image.created_at) as DateTime<true>
    await db.insert(images).values({
      id: image.id,
      directory: image.directory,
      filename: image.filename,
      dateCreated: new Date(data[0].created_at),
      dateIso: image.iso_date,
      dateAgg: d.hour < 5 ? d.minus({ day: 1 }).toSQLDate() : d.toSQLDate(),
      format: image.format,
      size: image.size,
      aspect: image.aspect,
      deleted: !!image.boolean,
    })
  }
}
