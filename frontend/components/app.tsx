import { css } from '../styled-system/css'
import { Flex } from '../styled-system/jsx'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import { trpc } from '../apis/trpc'
import Listings from './listings'
import Images from './images'

export default function App() {
  const styles = css({
    backgroundColor: 'slate.900',
    color: 'slate.100',
    '& h1': {
      _hover: {
        background: 'blue',
        color: 'red',
      },
    },
  })

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/trpc',
        }),
      ],
    })
  )

  const [queryClient] = useState(() => new QueryClient())

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Flex width='100vw' height='100vh' flexDir='column' className={styles} alignItems='center'>
          <h1>Hello test.</h1>
          {/* <Listings /> */}
          <Images />
        </Flex>
      </QueryClientProvider>
    </trpc.Provider>
  )
}
