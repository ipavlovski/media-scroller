import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../../backend/router'

export const trpc = createTRPCReact<AppRouter>()


/*
CATEGORIES
*/

export const useCategories = () => trpc.getCategories.useQuery()

export const useCreateCategory = () => {
  const createCategory = trpc.createCategory.useMutation()

  return async (name: string) => {
    return createCategory.mutateAsync({ name })
  }
}

/*
TAGS
*/

export const useTags = () => trpc.getTags.useQuery()

export const useCreateTag = () => {
  const createTag = trpc.createTag.useMutation()

  return async (name: string) => {
    return createTag.mutateAsync({ name })
  }
}
