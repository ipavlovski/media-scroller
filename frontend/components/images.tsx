import { animated, useSpring } from '@react-spring/web'
import type { Dispatch, MouseEventHandler, SetStateAction } from 'react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { create } from 'zustand'
import { InfiniteImages, useInfiniteImages } from '../apis/queries'
import { css } from '../styled-system/css'
import { useAllFilters } from './sidebar'

const fromServerThumb = (dirImg: string) => `http://localhost:3000/thumbs/${dirImg}`
const fromServerFull = (dirImg: string) => `http://localhost:3000/full/${dirImg}`

type Coords = { i: number; j: number }
const prepImages = <T extends { width: number; height: number }>(images: T[]) => {
  const max = 4
  const newRow = () => new Array(max).fill(true)
  const grid: boolean[][] = [newRow(), newRow()]
  const coords: Coords = { i: 0, j: 0 }

  for (const color of images) {
    // check item to the right (not beyond grid boundary, and not obstructed from above/right)
    const isWidthOK = color.width == 1
      || (coords.j + 2 <= max && grid[coords.i]![coords.j + 1]!)
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

export type SelectedImage = {
  id: number
  tagIds: number[]
  categoryId: number | null
  metadata: string[]
  setter: Dispatch<SetStateAction<boolean>>
}

type ActiveImage = { id: number; setter: Dispatch<SetStateAction<boolean>> }

type SelectionUpdate =
  | { type: 'tag'; tagId: number; imageIds: number[] }
  | { type: 'category'; categoryId: number; imageIds: number[] }

interface ImageStore {
  selected: SelectedImage[]
  active: ActiveImage | null
  modalUrl: string
  actions: {
    setModalUrl: (url: string) => void
    activate: (activeImage: ActiveImage) => void
    deactivate: () => void
    select: (selectedImage: SelectedImage) => void
    getSelected: () => SelectedImage[]
    updateSelected: (props: SelectionUpdate) => void
    deselect: (id: number) => void
    deselectAll: () => void
  }
}

const useImageStore = create<ImageStore>()((set, get) => ({
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
        state.active != null && state.active.id != active.id
          && state.active.setter(false)
        return ({ active })
      }),
    deactivate: () =>
      set((state) => {
        // if there is an existing selection, deselect it
        state.active != null && state.active.setter(false)
        return ({ active: null })
      }),
    select: (selection) => set((state) => ({ selected: [...state.selected, selection] })),
    getSelected: () => get().selected,
    updateSelected: (props) =>
      set((state) => {
        const updateType = props.type
        switch (updateType) {
          case 'category': {
            const { imageIds, categoryId } = props
            const selected = state.selected.map((selectedImage) => {
              const match = imageIds.find((updateImageId) =>
                updateImageId == selectedImage.id
              )
              if (match) selectedImage.categoryId = categoryId
              return selectedImage
            })
            return ({ selected })
          }
          case 'tag': {
            const { imageIds, tagId } = props
            const selected = state.selected.map((selectedImage) => {
              const match = imageIds.find((updateImageId) =>
                updateImageId == selectedImage.id
              )
              if (match) selectedImage.tagIds.push(tagId)
              return selectedImage
            })
            return ({ selected })
          }
          default:
            updateType satisfies never
            return ({ selected: state.selected })
        }
      }),
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
}))

export const useImageSelection = () => useImageStore((state) => state.selected)
export const useImageActions = () => useImageStore((state) => state.actions)

type ImageProps =
  & InfiniteImages['items'][0]['images'][0]
  & { width: number; height: number }
  & { left: string | undefined; right: string | undefined }
function Image(image: ImageProps) {
  const { directory, filename, width, height, dateIso, id, ...props } = image

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
      select({
        id,
        setter: setSelected,
        categoryId: image.categoryId,
        tagIds: image.imagesToTags.map((v) => v.tagId),
        metadata: image.metadata.flatMap((f) => f.content ? [f.content] : []),
      })
    } else {
      setSelected(false)
      deselect(id)
    }

    isSelected
      ? dimensionApi.start({ to: { width: 125 * width, height: 125 * height } })
      : dimensionApi.start({
        to: { width: (125 * width) - 5, height: (125 * height) - 5 },
      })
  }

  const shortClickHandler = () => {
    console.log(`clicked on: ${id}, ${props.metadata.map((v) => v.content).join(', ')} `)
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
    startLongPress
      ? timerId = setTimeout(longClickHandler, LONG_CLICK_MS)
      : clearTimeout(timerId)

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
        src={fromServerThumb(`${directory}/${filename}`)}
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
      {modalUrl != '' && (
        <img src={fromServerFull(modalUrl)} onClick={(e) => e.stopPropagation()} />
      )}
      <section onClick={(e) => (right && setModalUrl(right), e.stopPropagation())} />
    </dialog>
  )
}

export default function Images() {
  const { ref, inView } = useInView()

  const { data, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteImages()

  const { categories, tags, metadata } = useAllFilters()

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

  let left: string | undefined = undefined
  let center: string | undefined = undefined

  // const processFilters = <T extends { id: number }>(images: T[]) => {
  //   let filtered: T[]

  //   if (categories.length > 0)

  //   filtered = images.filter((image) => {
  //     let categoryId = image.categoryId || 0
  //     return categories.includes(categoryId)
  //   })
  // }

  return (
    <div className={styles.container}>
      <div>
        {data?.pages.map(({ items }, pageInd) =>
          items.map(({ date, images }, dateInd) => {
            const processedImages = prepImages(
              images.map((v) => ({ ...v, ...getAspect(v.aspect) })),
            )

            let filteredImages = processedImages
            if (categories.length > 0) {
              filteredImages = filteredImages.filter((image) => {
                // handle the 'uncategorized' condition
                let imageCategoryId = image.categoryId || 0
                return categories.includes(imageCategoryId)
              })
            }

            if (tags.length > 0) {
              filteredImages = filteredImages.filter((image) => {
                if (tags.includes(0) && image.imagesToTags.length == 0) return true
                return image.imagesToTags.find((v) => tags.includes(v.tagId))
              })
            }

            if (metadata.length > 0) {
              filteredImages = filteredImages.filter((image) => {
                let imageMetadata = image.metadata
                return imageMetadata.find((datum) =>
                  datum.content != null && metadata.includes(datum.content)
                )
              })
            }

            return (
              <Fragment key={date}>
                <h1 className={styles.header}>{date}</h1>
                <div className={styles.grid}>
                  {filteredImages.map((image, ind) => {
                    // try to get the 'next' item (in a triple-nested data-structure)
                    let nextItem = data?.pages.at(pageInd)?.items.at(dateInd)?.images.at(
                      ind + 1,
                    )
                    nextItem ??= data?.pages.at(pageInd)?.items.at(dateInd + 1)?.images
                      .at(0)
                    nextItem ??= data?.pages.at(pageInd + 1)?.items.at(0)?.images.at(0)
                    const right = nextItem && `${nextItem.directory}/${nextItem.filename}`

                    // make the current item 'last', and then refresh the current one
                    left = center
                    const item = data?.pages.at(pageInd)?.items.at(dateInd)?.images.at(
                      ind,
                    )
                    center = item && `${item.directory}/${item.filename}`

                    return <Image key={image.id} {...image} left={left} right={right} />
                  })}
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
