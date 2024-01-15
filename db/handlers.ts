import Database from 'better-sqlite3'
import { asc, between, count, desc, eq, gt, inArray, lte } from 'drizzle-orm'
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
async function createImageRecord(props: createImageRecordProps) {
  const { lastInsertRowid } = await db.insert(images).values(props)

  return lastInsertRowid
}

async function queryPaginatedById(limit: number, cursor: number) {
  return await db.select()
    .from(images)
    .orderBy(desc(images.id))
    .limit(limit)
    .where(gt(images.id, cursor))
}

async function queryByStartEndDate(startDate: string, endDate: string) {
  // return await db.select().from(images)
  //   .where(between(images.dateAgg, startDate, endDate))
  //   .orderBy(desc(images.dateIso))

  return await db.query.images.findMany({
    with: { imagesToTags: true, metadata: true },
    where: between(images.dateAgg, startDate, endDate),
    orderBy: desc(images.dateIso),
  })
}

async function queryPaginatedByDate(endDate: string) {
  // get all the aggregated data by day, before or on the provided day:
  // [ { date: '2023-09-30', count: 8 }, { date: '2023-09-29', count: 2 }, ...]
  const aggregated = await db.select({ date: images.dateAgg, count: count(images.id) })
    .from(images)
    .groupBy(images.dateAgg)
    .where(lte(images.dateAgg, endDate))
    .orderBy(desc(images.dateAgg))

  const MAX_IMAGES = 100
  let total = 0
  let cursor: string | undefined = undefined
  let startDate = ''

  for (let ind = 0; ind < aggregated.length; ind++) {
    total = total + aggregated[ind].count
    startDate = aggregated[ind].date
    cursor = aggregated[ind + 1]?.date
    if (total >= MAX_IMAGES) break
  }

  console.log(`first: ${startDate}, last: ${endDate}`)

  const matches = await queryByStartEndDate(startDate, endDate)

  // group-by OP, returns an object with dates as keys, and match-arrays as values
  // eg. { "2024-12-03": [match1, match2], "2024-12-04": [match3,match4,match5], ...}
  const objByDate = matches.reduce<{ [key: string]: typeof matches }>((group, item) => {
    const { dateAgg } = item
    group[dateAgg] = group[dateAgg] ?? []
    group[dateAgg].push(item)
    return group
  }, {})

  // convert the group-by object into iteratable array, sorted by key
  const arrByDate = Object.entries(objByDate).map(([key, val]) => ({ date: key, images: val }))

  return {
    nextCursor: cursor,
    items: arrByDate,
  }
}

async function updateImageTags(tagId: number, imageIds: number[]) {

  const values = imageIds.map((imageId) => ({ tagId, imageId }))

  const { changes } = await db.insert(imagesToTags).values(values).onConflictDoNothing()

  return changes
}

async function getCategories() {
  return await db.select().from(categories)
}

async function createCategory(name: string) {
  const { lastInsertRowid } = await db.insert(categories).values({ name })

  return lastInsertRowid
}

async function deleteCategories(name: string) {
  const deletedIds = await db.delete(categories).where(eq(categories.name, name)).returning({
    deletedId: categories.id,
  })

  return deletedIds
}

async function getTags() {
  return await db.select().from(tags)
}

async function createTag(name: string) {
  if (name.includes('lol')) throw new Error('NOT GOOD ENOUGH.')

  const { lastInsertRowid } = await db.insert(tags).values({ name })

  return lastInsertRowid
}

async function deleteTags(name: string) {
  const deletedIds = await db.delete(tags).where(eq(tags.name, name)).returning({
    deletedId: tags.id,
  })

  return deletedIds
}

async function getMetadata(imageId: number) {
  return await db.select().from(metadata).where(eq(metadata.imageId, imageId))
}

async function createMetadata(content: string, imageIds: number[]) {
  const matchingImages = await db.select().from(images).where(inArray(images.id, imageIds))

  let total = 0
  for (const image of matchingImages) {
    await db.insert(metadata).values({ content, id: image.id })
    total++
  }

  return total
}

async function deleteMetadata(metadataId: number) {
  const deletedIds = await db.delete(metadata).where(eq(metadata.id, metadataId)).returning({
    deletedId: metadata.id,
  })

  return deletedIds
}

export const tag = {
  get: getTags,
  create: createTag,
  delete: deleteTags,
}

export const category = {
  get: getCategories,
  create: createCategory,
  delete: deleteCategories,
}

export const meta = {
  get: getMetadata,
  create: createMetadata,
  delete: deleteMetadata,
}

export const image = {
  queryPaginatedByDate,
  updateTags: updateImageTags
}
