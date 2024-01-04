import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { queryPaginatedByDate, queryPaginatedById } from '../db/handlers'

const t = initTRPC.create()

// const publicProcedure = t.procedure
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
  // hello: publicProcedure.input(z.string().nullish()).query(({ input }) => {
  //   return `Hello ${input ?? 'World'}!`
  // }),
  // getUser: publicProcedure.input(z.string().nullish()).query(({ input }) => {
  //   return `Hello ${input ?? 'World'}!`
  // }),

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
        console.log(`val is ${val}`)
        return val 
      }, z.number()),
      limit: z.number(), // .nullish(), // <-- "cursor" needs to exist, but can be any type
    }),
  ).query(async ({ input: { cursor } }) => {
    console.log('GETTING INFINITE POSTS')
    const limit = 100

    // const items = await prisma.post.findMany({
    //   take: limit + 1, // get an extra item at the end which we'll use as next cursor
    //   where: {
    //     title: {
    //       contains: 'Prisma', /* Optional filter */
    //     },
    //   },
    //   cursor: cursor ? { myCursor: cursor } : undefined,
    //   orderBy: {
    //     myCursor: 'asc',
    //   },
    // })

    // const items = await queryPaginatedByDate(limit + 1, cursor)
    const items = await queryPaginatedById(limit + 1, cursor)

    let nextCursor: typeof cursor | undefined | null = undefined
    if (items.length > limit) {
      const nextItem = items.pop()
      nextCursor = nextItem!.id
    }
    return {
      items,
      nextCursor,
    }
  }),
})

export type AppRouter = typeof appRouter
