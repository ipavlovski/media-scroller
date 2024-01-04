import { trpc } from '../apis/trpc'

export default function Listings() {
  const tagQuery = trpc.getTags.useQuery({ name: 'tagName1' })
  const tagCreator = trpc.createTag.useMutation()
  
  return (
    <div>
      <p>{tagQuery.data?.name}</p>

      <button onClick={() => tagCreator.mutate({ name: 'Frodo' })}>
        Create Frodo
      </button>
    </div>
  )
}
