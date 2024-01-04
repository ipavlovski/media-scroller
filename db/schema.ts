import { relations, sql } from 'drizzle-orm'
import { integer, real, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  directory: text('directory').notNull(),
  filename: text('filename').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$default(() => new Date()),
  isoDate: text('iso_date'),
  format: text('format'), // png, gif
  size: real('size'), // size in MB
  aspect: integer('aspect'), // 1=big, 2=landscape, 3=portrait, 4=small
  deleted: integer('boolean', { mode: 'boolean' }).default(false),
  categoryId: integer("category_id"),

})

export const imageRelations = relations(images, ({ many, one }) => ({
  imagesToTags: many(imagesToTags),
  metadata: many(metadata),
  category: one(categories, {
    fields: [images.categoryId],
    references: [categories.id],
  })
}))

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$default(() => new Date()),
  color: text('color'),
})

export const categoryRelations = relations(categories, ({ many, one }) => ({
  images: many(images)
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
  imageId: integer("image_id"),

})

export const metadataRelations = relations(metadata, ({ one }) => ({
  image: one(images, {
    fields: [metadata.imageId],
    references: [images.id],
  }),
}))
