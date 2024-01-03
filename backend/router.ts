import { initTRPC } from '@trpc/server'
import { z } from 'zod'

const t = initTRPC.create()

const publicProcedure = t.procedure
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
})

export type AppRouter = typeof appRouter
