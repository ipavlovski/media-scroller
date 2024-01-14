import { animated, useSpring } from '@react-spring/web'
import type { Dispatch, MouseEventHandler, SetStateAction } from 'react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { create } from 'zustand'
import { trpc } from '../apis/queries'
import { css } from '../styled-system/css'

const fromServer = (dirImg: string) => `http://localhost:3000/${dirImg}`

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
interface ImageStore {
  selected: SelectedImage[]
  active: SelectedImage | null
  modalUrl: string
  actions: {
    setModalUrl: (url: string) => void
    activate: (selectedImage: SelectedImage) => void
    deactivate: () => void
    select: (selectedImage: SelectedImage) => void
    deselect: (id: number) => void
    deselectAll: () => void
  }
}

const useImageStore = create<ImageStore>()(
  (set) => ({
    selected: [],
    active: null,
    modalUrl: '',
    actions: {
      setModalUrl: (url) =>
        set((state) => {
          return ({ modalUrl: url })
        }),
      activate: (active) =>
        set((state) => {
          // if there is an existing selection (and it differs from incoming one), deselect it first
          state.active != null && state.active.id != active.id && state.active.setter(false)
          return ({ active })
        }),
      deactivate: () =>
        set((state) => {
          // if there is an existing selection, deselect it
          state.active != null && state.active.setter(false)
          return ({ active: null })
        }),
      select: (selection) => set((state) => ({ selected: [...state.selected, selection] })),
      deselect: (id) =>
        set((state) => {
          const item = state.selected.find((item) => item.id == id)
          item && item.setter(false)
          return { selected: state.selected.filter((item) => item.id != id) }
        }),
      deselectAll: () =>
        set((state) => {
          state.selected.map((item) => item.setter(false))
          return { selected: [] }
        }),
    },
  }),
)

export const useImageSelection = () => useImageStore((state) => state.selected)
export const useImageActions = () => useImageStore((state) => state.actions)

type ImageProps = {
  directory: string
  filename: string
  width: number
  height: number
  dateIso: string
  id: number
  left: string | undefined
  right: string | undefined
}

function Image({ directory, filename, width, height, dateIso, id, ...props }: ImageProps) {
  const [isSelected, setSelected] = useState(false)
  const [isActive, setActive] = useState(false)
  const { select, deselect, activate, setModalUrl } = useImageActions()

  /*
  SPRINGS
  */

  const [dimensionProps, dimensionApi] = useSpring(
    () => ({
      from: { width: 125 * width, height: 125 * height },
    }),
    [],
  )

  const [opacityProps, opacityApi] = useSpring(
    () => ({
      to: { opacity: 0 },
    }),
    [],
  )

  /*
  CLICK HANDLERS
  */

  const longClickHandler = () => {
    if (!isSelected) {
      setSelected(true)
      select({ id, setter: setSelected })
    } else {
      setSelected(false)
      deselect(id)
    }

    isSelected
      ? dimensionApi.start({ to: { width: 125 * width, height: 125 * height } })
      : dimensionApi.start({ to: { width: (125 * width) - 5, height: (125 * height) - 5 } })
  }

  const shortClickHandler = () => {
    setActive(true)
    activate({ id, setter: setActive })
  }

  const headerClickHandler = () => {
    setModalUrl(`${directory}/${filename}`)
  }

  /*
  MOUSE EVENTS
  */

  const [startLongPress, setStartLongPress] = useState(false)
  const LONG_CLICK_MS = 500

  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined
    startLongPress ? timerId = setTimeout(longClickHandler, LONG_CLICK_MS) : clearTimeout(timerId)

    return () => clearTimeout(timerId)
  }, [startLongPress])

  const onMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target instanceof HTMLElement && e.target.tagName == 'DIV') {
      headerClickHandler()

      // prevents long-click on the title from activating stuff
      return
    }
    setStartLongPress(true)
  }

  const onMouseUp = () => {
    shortClickHandler()
    setStartLongPress(false)
  }

  const onMouseEnter = () => {
    opacityApi.start({ to: { opacity: .7 }, delay: 200 })
  }

  const onMouseLeave = () => {
    opacityApi.start({ to: { opacity: 0 } })
    setStartLongPress(false)
  }

  const longPressProps = { onMouseUp, onMouseDown, onMouseEnter, onMouseLeave }

  return (
    <animated.div {...longPressProps} style={{
      position: 'relative',
      gridRow: `span ${height}`,
      gridColumn: `span ${width}`,
    }}>
      <animated.div
        style={{
          position: 'absolute',
          marginLeft: '4px',
          backgroundColor: 'black',
          ...{ opacity: isActive || isSelected ? .8 : opacityProps.opacity },
          ...{ width: dimensionProps.width },
          cursor: 'pointer',
          height: '1.5rem',
          fontSize: '.5rem',
        }}>
        {dateIso}
      </animated.div>
      <animated.img
        style={{
          margin: '4px',
          objectFit: 'cover',
          border: isSelected ? 'solid 2px yellow' : undefined,
          ...dimensionProps,
        }}
        src={fromServer(`${directory}/${filename}`)}
        data-left={props.left}
        data-center={`${directory}/${filename}`}
        data-right={props.right}
        title={dateIso} />
    </animated.div>
  )
}

function ZoomView() {
  const styles = css({
    margin: 'auto',
    position: 'relative',
    '&::backdrop': {
      backgroundColor: '#000000',
      opacity: '0.4',
    },
    '& section': {
      width: '20%',
      height: '100vh',
      position: 'fixed',
      cursor: 'pointer',
      left: '0',
      top: '0',
      _hover: {
        backgroundColor: 'black',
        opacity: '0.3',
        transition: 'background-color 300ms ease-in-out',
      },
    },
    '& section:nth-child(3)': {
      left: '80%',
      top: '0',
    },
  })

  const modalUrl = useImageStore((store) => store.modalUrl)
  const { setModalUrl } = useImageActions()

  const ref = useRef<HTMLDialogElement>(null)

  const [{ left, right }, setLinks] = useState<{ left?: string; right?: string }>({})

  useEffect(() => {
    if (!ref || modalUrl == '') return
    ref.current?.showModal()
    const img = document.querySelector<HTMLImageElement>(`img[data-center="${modalUrl}"]`)
    setLinks({ left: img?.dataset?.left, right: img?.dataset?.right })
  }, [modalUrl])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // console.log(`pressed: ${e.key}: left=${left} right=${right}`)
      switch (e.key) {
        case 'ArrowRight':
          right && setModalUrl(right)
          break
        case 'ArrowLeft':
          left && setModalUrl(left)
          break
        default:
          return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [left, right])

  return (
    <dialog ref={ref} className={styles} onClose={() => setModalUrl('')}
      onClick={(e) => e.currentTarget.close()}>
      <section onClick={(e) => (left && setModalUrl(left), e.stopPropagation())} />
      <img src={fromServer(modalUrl)} onClick={(e) => e.stopPropagation()}
        style={{ display: 'block' }} />
      <section onClick={(e) => (right && setModalUrl(right), e.stopPropagation())} />
    </dialog>
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

  const getNear = <T extends { directory: string; filename: string }>(arr: T[], ind: number) => {
    const left = arr.at(ind - 1)
    const right = arr.at(ind + 1)

    return {
      left: left && `${left.directory}/${left.filename}`,
      right: right && `${right.directory}/${right.filename}`,
    }
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
                  {processedImages.map((image, ind, arr) => (
                    <Image key={image.id} {...image} {...getNear(arr, ind)} />
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

      <ZoomView />
    </div>
  )
}
