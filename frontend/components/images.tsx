import { Fragment, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { trpc } from '../apis/trpc'
import { css } from '../styled-system/css'

const styles = {
  container: css({
    margin: '1rem',
  }),
  header: css({
    fontSize: '2rem',
    marginTop: '3rem',
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
  footer: css({
    display: 'flex',
    flexDir: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    fontSize: '3rem',
    textTransform: 'uppercase',
    borderTop: 'solid white',
  }),
}

const fromServer = (dir: string, img: string) => {
  return `http://localhost:3000/${dir}/${img}`
}

export default function Images() {
  console.log('Loading images...')

  const { ref, inView } = useInView()

  // data, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage
  const { data, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage } = trpc.infinitePosts
    .useInfiniteQuery({}, {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: new Date().toISOString().substring(0, 10),
    })

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage])

  if (isSuccess) console.log(`success!: pages= ${data.pages.length}`)

  return (
    <>
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
      <div className={styles.footer} ref={ref}>
        <h3>This is a footer</h3>
        {isFetchingNextPage && <p>... loading ...</p>}
      </div>
    </>
  )
}
