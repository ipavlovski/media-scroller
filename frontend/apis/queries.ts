import { createTRPCReact } from '@trpc/react-query'
import { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '../../backend/router'
import { useImageActions } from '../components/images'
type RouterOutput = inferRouterOutputs<AppRouter>

export const trpc = createTRPCReact<AppRouter>()

/* IMAGES */

export const useInfiniteImages = () =>
  trpc.infiniteImages
    .useInfiniteQuery({}, {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: new Date().toISOString().substring(0, 10),
    })

export const useUpdateImageTags = () => {
  const { updateSelected } = useImageActions()

  const updateImages = trpc.updateImages.useMutation({
    onSuccess: (data) => {
      if (data.length == 0) return
      const tagId = data[0].tagId
      const imageIds = data.map((v) => v.imageId)
      updateSelected({ type: 'tag', imageIds, tagId })

    },
  })

  return async (tagId: number, imageIds: number[]) => {
    return updateImages.mutateAsync({ tagId, imageIds })
  }
}

export type InfiniteImages = RouterOutput['infiniteImages']

/* CATEGORIES */

export const useCategories = () => trpc.getCategories.useQuery()

export const useCreateCategory = () => {
  const utils = trpc.useUtils()
  const createCategory = trpc.createCategory.useMutation({
    onSuccess: () => {
      utils.getCategories.invalidate()
    },
  })

  return async (name: string) => {
    return createCategory.mutateAsync({ name })
  }
}

/* TAGS */

export const useTags = () => trpc.getTags.useQuery()

export const useCreateTag = () => {
  const utils = trpc.useUtils()
  const createTag = trpc.createTag.useMutation({
    onSuccess: () => {
      utils.getTags.invalidate()
    },
  })

  return async (name: string) => {
    return createTag.mutateAsync({ name })
  }
}

export type Tags = RouterOutput['getTags']
