import Database from 'better-sqlite3'
import { asc, between, desc, gt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const db = drizzle(new Database('./db/sqlite.db'), { schema })
const { images, tags, categories, metadata, imagesToTags } = schema

db.select().from(images).all()

type createImageRecordProps = {
  directory: string
  filename: string
  aspect: 1 | 2 | 3 | 4
  format: string
  size: number
  createdAt: Date
  isoDate: string
}
export async function createImageRecord(props: createImageRecordProps) {
  const { lastInsertRowid } = await db.insert(images).values(props)

  return lastInsertRowid
}

export async function queryPaginatedByDate(limit: number, cursor: Date) {
  return await db.select()
    .from(images)
    .orderBy(desc(images.createdAt))
    .limit(limit)
    .where(gt(images.createdAt, cursor))
}


export async function queryPaginatedById(limit: number, cursor: number) {
  return await db.select()
    .from(images)
    .orderBy(desc(images.id))
    .limit(limit)
    .where(gt(images.id, cursor))
}
