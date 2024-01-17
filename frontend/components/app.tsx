import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import { trpc } from '../apis/queries'
import Images from './images'
import Sidebar from './sidebar'
import { Toaster } from './toast'

export default function App() {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/trpc',
        }),
      ],
    })
  )

  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
        },
      },
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Sidebar />
        <Images />
        <Toaster />
      </QueryClientProvider>
    </trpc.Provider>
  )
}
