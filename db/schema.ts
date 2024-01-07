import { relations, sql } from 'drizzle-orm'
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { DateTime } from 'luxon'

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  directory: text('directory').notNull(),
  filename: text('filename').notNull(),
  dateCreated: integer('date_created', { mode: 'timestamp_ms' })
    .$default(() => new Date()).notNull(),
  dateIso: text('date_iso')
    .$default(() => DateTime.now().toISO()).notNull(),
  dateAgg: text('date_agg').$default(() => {
    const d = DateTime.now()
    return d.hour < 5 ? d.minus({ day: 1 }).toSQLDate() : d.toSQLDate()
  }).notNull(),
  format: text('format').notNull(), // png, gif
  size: real('size').notNull(), // size in MB
  aspect: integer('aspect').notNull(), // 1=big, 2=landscape, 3=portrait, 4=small
  deleted: integer('deleted', { mode: 'boolean' }).default(false).notNull(),
  categoryId: integer('category_id'),
})

export const imageRelations = relations(images, ({ many, one }) => ({
  imagesToTags: many(imagesToTags),
  metadata: many(metadata),
  category: one(categories, {
    fields: [images.categoryId],
    references: [categories.id],
  }),
}))

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$default(() => new Date()),
  color: text('color'),
})

export const categoryRelations = relations(categories, ({ many, one }) => ({
  images: many(images),
}))

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$default(() => new Date()),
  color: text('color'),
})

export const tagRelations = relations(tags, ({ many }) => ({
  imagesToTags: many(imagesToTags),
}))

export const imagesToTags = sqliteTable('images_to_tags', {
  imageId: integer('image_id').notNull().references(() => images.id),
  tagId: integer('tag_id').notNull().references(() => tags.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.imageId, t.tagId] }),
}))

export const imagesToTagsRelations = relations(imagesToTags, ({ one }) => ({
  image: one(images, {
    fields: [imagesToTags.imageId],
    references: [images.id],
  }),
  tag: one(tags, {
    fields: [imagesToTags.tagId],
    references: [tags.id],
  }),
}))

export const metadata = sqliteTable('metadata', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$default(() => new Date()),
  imageId: integer('image_id'),
})

export const metadataRelations = relations(metadata, ({ one }) => ({
  image: one(images, {
    fields: [metadata.imageId],
    references: [images.id],
  }),
}))
