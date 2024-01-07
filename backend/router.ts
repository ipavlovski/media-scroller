import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { queryPaginatedById, queryPaginatedByDate  } from '../db/handlers'

const t = initTRPC.create()
const router = t.router

async function getTags(name: string) {
  console.log('GETTING TAGS')
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return { name: `queried tag: ${name}` }
}

async function createTag(name: string) {
  console.log('CREATING TAGS')
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return { name: `new tag: ${name}` }
}

export const appRouter = router({

  getTags: t.procedure.input(
    z.object({ name: z.string() }),
  ).query(async ({ input: { name } }) => {
    return await getTags(name)
  }),

  createTag: t.procedure.input(
    z.object({ name: z.string() }),
  ).mutation(async ({ input: { name } }) => {
    return await createTag(name)
  }),

  infinitePosts: t.procedure.input(
    z.object({
      cursor: z.preprocess((val) => {
        console.log(`cursor is ${val}`)
        return val
      }, z.string().length(10)),
    }),
  ).query(async ({ input: { cursor } }) => {

    console.log(`receving this cursor: ${cursor}`)
    const { items, nextCursor} = await queryPaginatedByDate(cursor)
    console.log(`sending back nextCursor: ${nextCursor}`)
    
    return {
      items,
      nextCursor,
    }
  }),
})

export type AppRouter = typeof appRouter
