import { relations, sql } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  directory: text('directory').notNull(),
  filename: text('filename').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$default(() => new Date()),
  deleted: integer('boolean', { mode: 'boolean' }).default(false),
})

export const imagesRelations = relations(images, ({ many }) => ({
  imagesToTags: many(imagesToTags),
}))

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).$default(() => new Date()),
  color: text('color'),
})

export const tagsRelations = relations(tags, ({ many }) => ({
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

export const user = sqliteTable('user', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
})

export const book = sqliteTable('book', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  authorId: integer('author_id').references(() => user.id),
})
