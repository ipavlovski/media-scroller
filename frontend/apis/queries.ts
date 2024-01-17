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

export type Categories = RouterOutput['getCategories']

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

/*
  Handle 3 types of modifications: categories, tags, metadta
*/
const useUpdateImages = () => {
  const { updateSelected } = useImageActions()
  const utils = trpc.useUtils()

  return trpc.updateImages.useMutation({
    onSuccess: (queryData) => {
      if (queryData == null || !queryData.updateRecords?.length) return
      const { type, updateRecords } = queryData
      const imageIds = updateRecords.map((v) => v.imageId)

      /* STEP 1: PARTIAL SELECTION UPDATE */
      // NOTE - actual handler logic is located in the store
      //  implement it in there
      switch (type) {
        case 'tag':
          updateSelected({ type, imageIds, tagId: queryData.tagId })
          break
        case 'category':
          updateSelected({ type, imageIds, categoryId: queryData.categoryId })
          break
      }

      /* STEP 2: PARTIAL CACHE UPDATE */
      // NOTE - is this really faster?
      //  maybe just invalidate ALL, let it rerender on its own
      utils.infiniteImages.setInfiniteData({}, (cachedData) => {
        if (!cachedData) return { pages: [], pageParams: [] }

        const idAgg: { [key: string]: number[] } = {}
        updateRecords.forEach(({ imageId, dateAgg }) => {
          idAgg[dateAgg] ??= []
          idAgg[dateAgg].push(imageId)
        })

        Object.entries(idAgg).forEach(([dateAgg, imageIds]) =>
          cachedData.pages.forEach(({ items }) =>
            items.forEach(({ date, images }) => {
              date == dateAgg && imageIds.forEach((imageId) => {
                let image = images.find((image) => image.id == imageId)

                switch (type) {
                  case 'tag':
                    image?.imagesToTags.push({ imageId, tagId: queryData.tagId })
                    break
                  case 'category':
                    console.log('SHOULD UPDATE CATEGORY...')
                    if (image != null) {
                      image = { ...image, categoryId: queryData.categoryId }
                    }

                    break
                }
              })
            })
          )
        )
        return { ...cachedData, pages: cachedData.pages }
      })
    },
  })
}

// export const useUpdateImageTags = () => {
//   const { updateSelected } = useImageActions()
//   const utils = trpc.useUtils()

//   const updateImages = trpc.updateImages.useMutation({
//     onSuccess: (data) => {
//       if (!data?.images?.length) return

//       // update selection
//       const { images: updatedImages, tagId } = data
//       const imageIds = updatedImages.map((v) => v.imageId)
//       updateSelected({ type: 'tag', imageIds, tagId })

//       // update query cache
//       // note - is this really faster? maybe just invalidate ALL, let it rerender on its own
//       utils.infiniteImages.setInfiniteData({}, (data) => {
//         if (!data) return { pages: [], pageParams: [] }

//         const tagAgg: { [key: string]: number[] } = {}
//         updatedImages.forEach(({ imageId, dateAgg }) => {
//           tagAgg[dateAgg] ??= []
//           tagAgg[dateAgg].push(imageId)
//         })

//         Object.entries(tagAgg).forEach(([dateAgg, imageIds]) => {
//           data.pages.forEach(({ items }) =>
//             items.forEach(({ date, images }) => {
//               date == dateAgg && imageIds.forEach((imageId) =>
//                 images.find((image) => image.id == imageId)?.imagesToTags.push({ imageId,
//                   tagId })
//               )
//             })
//           )
//         })

//         return { ...data }
//       })
//     },
//   })

//   return async (tagId: number, imageIds: number[]) => {
//     return updateImages.mutateAsync({ tagId, imageIds })
//   }
// }

export const useUpdateImageTags = () => {
  const updateImages = useUpdateImages()

  return async (tagId: number, imageIds: number[]) => {
    return updateImages.mutateAsync({ type: 'tag', tagId, imageIds })
  }
}

export const useUpdateImageCategories = () => {
  const updateImages = useUpdateImages()

  return async (categoryId: number, imageIds: number[]) => {
    return updateImages.mutateAsync({ type: 'category', categoryId, imageIds })
  }
}

export type Tags = RouterOutput['getTags']
