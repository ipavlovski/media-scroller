import Database from 'better-sqlite3'
import { between, count, desc, eq, inArray, lte } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { processImage } from './fs-handlers'

const db = drizzle(new Database('./db/sqlite.db'), { schema })
const { images, tags, categories, metadata, imagesToTags } = schema


//  ==============================
//              IMAGES            
//  ==============================

async function queryByStartEndDate(startDate: string, endDate: string) {
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
  const arrByDate = Object.entries(objByDate).map(([key, val]) => ({ date: key,
    images: val })
  )

  return {
    nextCursor: cursor,
    items: arrByDate,
  }
}

async function addImage(filename: string) {
  const imageProps = await processImage(filename)
  return await db.insert(images).values(imageProps)
}


async function updateImageTags(tagId: number, imageIds: number[]) {
  const values = imageIds.map((imageId) => ({ tagId, imageId }))
  const changes = await db.insert(imagesToTags)
    .values(values)
    .onConflictDoNothing()
    .returning({ imageId: imagesToTags.imageId })

  // need to do these shanenigans to return dateAgg, which will help rapidly index cached queries
  // instead of iterating over each page->date->image like a savage, could quickly find page->date
  // and skip over all page->dates which are not in the dateAgg updateImageRows
  const updatedImageIds = changes.map((v) => v.imageId)
  const updatedImageRows = await db.select({ imageId: images.id,
    dateAgg: images.dateAgg })
    .from(images)
    .where(inArray(images.id, updatedImageIds))

  return { type: 'tag' as const, tagId, updateRecords: updatedImageRows }
}

async function updateImageCategories(categoryId: number, imageIds: number[]) {
  const updatedImageCategories = await db.update(images)
    .set({ categoryId })
    .where(inArray(images.id, imageIds))
    .returning({ imageId: images.id, dateAgg: images.dateAgg })

  return { type: 'category' as const, categoryId, updateRecords: updatedImageCategories }
}

async function deleteImages(imageIds: number[]) {
  const changes = await db.transaction(async (tx) => {
    await tx.delete(imagesToTags).where(inArray(imagesToTags.imageId, imageIds))
    await tx.delete(metadata).where(inArray(metadata.imageId, imageIds))

    return await tx.delete(images)
      .where(inArray(images.id, imageIds))
      .returning({ imageId: images.id, dateAgg: images.dateAgg })
  })

  return changes
}

//  ==================================
//              CATEGORIES
//  ==================================

async function getCategories() {
  return await db.select().from(categories)
}

async function createCategory(name: string) {
  const { lastInsertRowid } = await db.insert(categories).values({ name })

  return lastInsertRowid
}

async function deleteCategories(name: string) {
  const deletedIds = await db.delete(categories).where(eq(categories.name, name))
    .returning({
      deletedId: categories.id,
    })

  return deletedIds
}

//  ============================
//              TAGS
//  ============================

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

//  =================================
//              METADATA
//  =================================

async function getMetadata(imageId: number) {
  return await db.select().from(metadata).where(eq(metadata.imageId, imageId))
}

async function createMetadata(content: string, imageIds: number[]) {
  const matchingImages = await db.select().from(images).where(
    inArray(images.id, imageIds),
  )

  let total = 0
  for (const image of matchingImages) {
    await db.insert(metadata).values({ content, id: image.id })
    total++
  }

  return total
}

async function deleteMetadata(metadataId: number) {
  const deletedIds = await db.delete(metadata).where(eq(metadata.id, metadataId))
    .returning({
      deletedId: metadata.id,
    })

  return deletedIds
}

//  ==============================
//              EXPORTS
//  ==============================

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
  addImage,
  queryPaginatedByDate,
  updateTags: updateImageTags,
  updateCategories: updateImageCategories,
  delete: deleteImages,
}
