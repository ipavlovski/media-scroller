import { createTRPCReact,  } from '@trpc/react-query'
import type { AppRouter } from '../../backend/router'

export const trpc = createTRPCReact<AppRouter>()

// export const useCreateTag = () => trpc.createTag.useMutation()
// export const useCreateCategory = () => trpc.createCategory.useMutation()


