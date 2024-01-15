import { initTRPC } from '@trpc/server'
import { z } from 'zod'
// import { queryPaginatedById, queryPaginatedByDate, getTags, createTag, getCategories  } from '../db/handlers'
import { category, image, meta, tag } from '../db/handlers'

const t = initTRPC.create()
const router = t.router

// async function getTags(name: string) {
//   console.log('GETTING TAGS')
//   await new Promise((resolve) => setTimeout(resolve, 1000))

//   return { name: `queried tag: ${name}` }
// }

// async function createTag(name: string) {
//   console.log('CREATING TAGS')
//   await new Promise((resolve) => setTimeout(resolve, 1000))
//   return { name: `new tag: ${name}` }
// }

export const appRouter = router({
  // getTags: t.procedure.input(
  //   z.object({ name: z.string() }),
  // ).query(async ({ input: { name } }) => {
  //   return await tag.get()
  // }),

  getTags: t.procedure.query(async () => {
    return await tag.get()
  }),

  createTag: t.procedure.input(
    z.object({ name: z.string() }),
  ).mutation(async ({ input: { name } }) => {
    return await tag.create(name)
  }),

  // getCategories: t.procedure.input(
  //   z.object({ name: z.string() }),
  // ).query(async ({ input: { name } }) => {
  //   return await category.get()
  // }),

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
})

export type AppRouter = typeof appRouter
