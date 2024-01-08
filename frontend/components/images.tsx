import { Fragment, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { trpc } from '../apis/trpc'
import { css } from '../styled-system/css'

type Coords = { i: number; j: number }
const prepImages = <T extends { width: number; height: number }>(images: T[]) => {
  const max = 4
  const newRow = () => new Array(max).fill(true)
  const grid: boolean[][] = [newRow(), newRow()]
  const coords: Coords = { i: 0, j: 0 }

  for (const color of images) {
    // check item to the right (not beyond grid boundary, and not obstructed from above)
    const isWidthOK = color.width == 1 || (coords.j + 2 <= max && grid[coords.i]![coords.j + 1]!)
    if (!isWidthOK) color.width = 1

    // insert item
    grid[coords.i]![coords.j]! = false
    if (color.width == 2) grid[coords.i]![coords.j + 1]! = false
    if (color.height == 2) grid[coords.i + 1]![coords.j]! = false
    if (color.width == 2 && color.height == 2) grid[coords.i + 1]![coords.j + 1]! = false

    // after inserting the item, increment positional index
    const ind = grid[coords.i]!.findIndex((v) => v == true)
    coords.j = ind != -1 ? ind : max

    // check if maxed-out the row
    if (coords.j == max) {
      const ind = grid[coords.i + 1]!.findIndex((v) => v == true)
      if (ind >= 0) {
        coords.j = ind
        coords.i = coords.i + 1
        grid.push(newRow())
      } else {
        coords.j = 0
        coords.i = coords.i + 2
        grid.push(newRow(), newRow())
      }
    }
  }

  return images
}

const styles = {
  container: css({
    marginLeft: '12rem',
  }),
  header: css({
    fontSize: '2rem',
    marginTop: '5rem',
    _first: { marginTop: '1rem' },
  }),
  grid: css({
    display: 'grid',
    gridTemplateColumns: '200px 200px 200px 200px',
    gridAutoRows: '200px',
    rowGap: '5px',
    columnGap: '5px',
    // justifyContent: 'center',
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

function Sidebar() {
  const styles = css({
    position: 'fixed',
    width: '5rem',
    '& p': {
      margin: '.5rem',
    },
  })

  return (
    <div className={styles}>
      <p>test1</p>
      <p>test2</p>
      <p>test3</p>
      <p>test4</p>
      <p>test5</p>
      <p>test6</p>
      <p>test7</p>
      <p>test8</p>
      <p>test9</p>
      <p>test10</p>
      <p>test11</p>
      <p>test12</p>
      <p>test13</p>
      <p>test14</p>
      <p>test15</p>
      <p>test16</p>
      <p>test17</p>
      <p>test18</p>
      <p>test19</p>
      <p>test20</p>
    </div>
  )
}

export default function Layouts() {
  return (
    <>
      <Sidebar />
      <ImageListings />
    </>
  )
}

const getAspect = (aspect: number) => {
  // 1=big, 2=landscape, 3=portrait, 4=small
  return aspect == 1 ? { width: 2, height: 2 } : aspect == 2
    ? { width: 2, height: 1 }
    : aspect == 3
    ? { width: 1, height: 2 }
    : { width: 1, height: 1 }
}

function ImageListings() {
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
    <div className={styles.container}>
      <div>
        {data?.pages.map(({ items }) =>
          items.map(({ date, images }) => {
            const processedImages = prepImages(
              images.map((v) => ({ ...v, ...getAspect(v.aspect) })),
            )

            return (
              <Fragment key={date}>
                <h1 className={styles.header}>{date}</h1>
                <div className={styles.grid}>
                  {processedImages.map(({ directory, filename, width, height }) => (
                    <img style={{
                      gridRow: `span ${height}`,
                      gridColumn: `span ${width}`,
                      objectFit: 'cover',
                      width: `${200 * width}`,
                      height: `${200 * height}`,
                    }} src={fromServer(directory, filename)} />
                  ))}
                </div>
              </Fragment>
            )
          })
        )}
      </div>
      <div className={styles.footer} ref={ref}>
        <h3>This is a footer</h3>
        {isFetchingNextPage && <p>... loading ...</p>}
      </div>
    </div>
  )
}
