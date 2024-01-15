import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { category, image, meta, tag } from '../db/handlers'

const t = initTRPC.create()
const router = t.router

export const appRouter = router({
  getTags: t.procedure.query(async () => {
    return await tag.get()
  }),

  createTag: t.procedure.input(
    z.object({ name: z.string() }),
  ).mutation(async ({ input: { name } }) => {
    return await tag.create(name)
  }),

  getCategories: t.procedure.query(async () => {
    return await category.get()
  }),

  createCategory: t.procedure.input(
    z.object({ name: z.string() }),
  ).mutation(async ({ input: { name } }) => {
    return await category.create(name)
  }),

  getMetadata: t.procedure.input(
    z.object({ imageId: z.number() }),
  ).query(async ({ input: { imageId } }) => {
    return await meta.get(imageId)
  }),

  createMetadata: t.procedure.input(
    z.object({ content: z.string(), imageIds: z.number().array() }),
  ).mutation(async ({ input: { content, imageIds } }) => {
    return await meta.create(content, imageIds)
  }),

  infiniteImages: t.procedure.input(
    z.object({
      cursor: z.preprocess((val) => {
        console.log(`cursor is ${val}`)
        return val
      }, z.string().length(10)),
    }),
  ).query(async ({ input: { cursor } }) => {
    const { items, nextCursor } = await image.queryPaginatedByDate(cursor)

    return {
      items,
      nextCursor,
    }
  }),

  updateImages: t.procedure.input(
    z.object({ tagId: z.number(), imageIds: z.number().array() }),
  ).mutation(async ({ input: { tagId, imageIds } }) => {
    return await image.updateTags(tagId, imageIds)
  }),

})

export type AppRouter = typeof appRouter
