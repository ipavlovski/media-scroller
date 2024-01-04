import { trpc } from '../apis/trpc'

export default function Images() {
  console.log('Loading images...')
  const myQuery = trpc.infinitePosts.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: 1000,
    },
  )

  return (
    <div>
      {myQuery.data?.pages?.map(({ items }) =>
        items.map(({ filename, id }) => <p key={filename}>{id}: {filename}</p>)
      )}
    </div>
  )
}
