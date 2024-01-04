import { trpc } from '../apis/trpc'

export default function Images() {
  
  console.log('Loading images...')

  const myQuery = trpc.infinitePosts.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam: (lastPage: any) => lastPage.nextCursor,
      // initialCursor: 1, // <-- optional you can pass an initialCursor
    },
  )

  return (
    <div>
      {myQuery.data?.map((v: any) => <p>{v.id}</p>)}
    </div>
  )
}
