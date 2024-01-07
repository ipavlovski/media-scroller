import { Fragment } from 'react'
import { trpc } from '../apis/trpc'
import { css } from '../styled-system/css'

const styles = {
  container: css({
    margin: '1rem',
  }),
  header: css({
    fontSize: '2rem',
    marginTop: '3rem'
  }),
  grid: css({
    display: 'grid',
    gridTemplateColumns: '200px 200px 200px',
    columnGap: 5,
    rowGap: 5,
  }),
  image: css({
    margin: '4px',
  }),
}

const fromServer = (dir: string, img: string) => {
  return `http://localhost:3000/${dir}/${img}`
}

export default function Images() {
  console.log('Loading images...')

  // data, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage
  const { data, isSuccess, hasNextPage } = trpc.infinitePosts.useInfiniteQuery({}, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialCursor: new Date().toISOString().substring(0, 10),
  })

  if (isSuccess) console.log(`success!: pages= ${data.pages.length}`)

  return (
    <div className={styles.container}>
      {data?.pages.map(({ items }) =>
        items.map(({ date, images }) => (
          <Fragment key={date}>
            <h1 className={styles.header}>{date}</h1>
            <div className={styles.grid}>
              {images.map(({ directory, filename }) => (
                <img className={styles.image} src={fromServer(directory, filename)} />
              ))}
            </div>
          </Fragment>
        ))
      )}
    </div>
  )
}
