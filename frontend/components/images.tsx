import { animated, useSpring } from '@react-spring/web'
import { Fragment, useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useInView } from 'react-intersection-observer'
import { create } from 'zustand'
import { trpc } from '../apis/queries'
import { css } from '../styled-system/css'

const fromServer = (dir: string, img: string) => `http://localhost:3000/${dir}/${img}`

type Coords = { i: number; j: number }
const prepImages = <T extends { width: number; height: number }>(images: T[]) => {
  const max = 4
  const newRow = () => new Array(max).fill(true)
  const grid: boolean[][] = [newRow(), newRow()]
  const coords: Coords = { i: 0, j: 0 }

  for (const color of images) {
    // check item to the right (not beyond grid boundary, and not obstructed from above/right)
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

const getAspect = (aspect: number) => {
  // 1=big, 2=landscape, 3=portrait, 4=small
  return aspect == 1 ? { width: 2, height: 2 } : aspect == 2
    ? { width: 2, height: 1 }
    : aspect == 3
    ? { width: 1, height: 2 }
    : { width: 1, height: 1 }
}

type SelectedImage = { id: number; setter: Dispatch<SetStateAction<boolean>> }
interface ImageSelectionStore {
  active: SelectedImage[]
  actions: {
    select: (selectedImage: SelectedImage) => void
    deselect: (id: number) => void
    deselectAll: () => void
  }
}

const useImageSelectionStore = create<ImageSelectionStore>()(
  (set) => ({
    active: [],
    actions: {
      select: (selection) => set((state) => ({ active: [...state.active, selection] })),
      deselect: (id) =>
        set((state) => {
          const item = state.active.find((item) => item.id == id)
          item && item.setter(false)
          return { active: state.active.filter((item) => item.id != id) }
        }),
      deselectAll: () =>
        set((state) => {
          state.active.map((item) => item.setter(false))
          return { active: [] }
        }),
    },
  }),
)

export const useImageSelection = () => useImageSelectionStore((state) => state.active)
export const useImageActions = () => useImageSelectionStore((state) => state.actions)

function useLongPress(callback = () => {}, ms = 300) {
  const [startLongPress, setStartLongPress] = useState(false)

  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined
    startLongPress ? timerId = setTimeout(callback, ms) : clearTimeout(timerId)

    return () => clearTimeout(timerId)
  }, [callback, ms, startLongPress])

  return {
    onMouseDown: () => setStartLongPress(true),
    onMouseUp: () => setStartLongPress(false),
    onMouseLeave: () => setStartLongPress(false),
  }
}

type ImageProps = {
  directory: string
  filename: string
  width: number
  height: number
  dateIso: string
  id: number
}

function Image({ directory, filename, width, height, dateIso, id }: ImageProps) {
  const [isSelected, setSelected] = useState(false)
  const { select, deselect } = useImageActions()

  const [props, api] = useSpring(
    () => ({
      from: { width: 125 * width, height: 125 * height },
    }),
    [],
  )

  const longPressHandler = () => {
    if (!isSelected) {
      setSelected(true)
      select({ id, setter: setSelected })
    } else {
      setSelected(false)
      deselect(id)
    }

    isSelected
      ? api.start({ to: { width: 125 * width, height: 125 * height } })
      : api.start({ to: { width: (125 * width) - 5, height: (125 * height) - 5 } })
  }
  const longPressProps = useLongPress(longPressHandler, 500)
  const styles = css({ margin: '4px' })

  return (
    <animated.img
      key={id}
      {...longPressProps}
      className={styles}
      onClick={() => {
        console.log('CLICK')
      }}
      style={{
        gridRow: `span ${height}`,
        gridColumn: `span ${width}`,
        objectFit: 'cover',
        border: isSelected ? 'solid 2px yellow' : undefined,
        ...props,
      }}
      src={fromServer(directory, filename)}
      title={dateIso} />
  )
}

export default function Images() {
  const { ref, inView } = useInView()

  const { data, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage } = trpc.infinitePosts
    .useInfiniteQuery({}, {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: new Date().toISOString().substring(0, 10),
    })

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage])

  if (isSuccess) console.log(`success!: pages= ${data.pages.length}`)

  const styles = {
    container: css({
      marginLeft: '12rem',
    }),
    header: css({
      fontSize: '1.4rem',
      fontWeight: 'bold',
      marginTop: '2rem',
      _first: { marginTop: '1rem' },
    }),
    grid: css({
      display: 'grid',
      gridTemplateColumns: '125px 125px 125px 125px',
      gridAutoRows: '125px',
      rowGap: '5px',
      columnGap: '5px',
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
                  {processedImages.map((image) => <Image {...image} />)}
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
