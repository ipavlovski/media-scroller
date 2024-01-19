import { animated, useSpring } from '@react-spring/web'
import type { Dispatch, MouseEventHandler, SetStateAction } from 'react'
import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { InfiniteImages, useInfiniteImages } from '../apis/queries'
import { css } from '../styled-system/css'
import { Filters, useAllFilters } from './sidebar'
import { useZoomActions } from './zoom'

const fromServerThumb = (dirImg: string) => `http://localhost:3000/thumbs/${dirImg}`

//  ==============================
//              TYPES
//  ==============================

type ActiveImage = { id: number; setter: Dispatch<SetStateAction<boolean>> }

type SelectionUpdate =
  | { type: 'tag'; tagId: number; imageIds: number[] }
  | { type: 'category'; categoryId: number; imageIds: number[] }

type Coords = { i: number; j: number }

type ImageProps =
  & InfiniteImages['items'][0]['images'][0]
  & { width: number; height: number }

export type SelectedImage = {
  id: number
  tagIds: number[]
  categoryId: number | null
  metadata: string[]
  setter: Dispatch<SetStateAction<boolean>>
}

//  ==============================
//              UTILS
//  ==============================

const getAspect = (aspect: number) => {
  // 1=big, 2=landscape, 3=portrait, 4=small
  return aspect == 1 ? { width: 2, height: 2 } : aspect == 2
    ? { width: 2, height: 1 }
    : aspect == 3
    ? { width: 1, height: 2 }
    : { width: 1, height: 1 }
}

// const prepImages = <T extends { width: number; height: number }>(images: T[]) => {}
const prepImages = <T extends { aspect: number }>(images: T[]) => {
  const max = 4
  const newRow = () => new Array(max).fill(true)
  const grid: boolean[][] = [newRow(), newRow()]
  const coords: Coords = { i: 0, j: 0 }

  return images.map((v) => {
    const dims = getAspect(v.aspect)
    const image = { ...v, ...dims }

    // check item to the right (not beyond grid boundary, and not obstructed from above/right)
    const isWidthOK = image.width == 1
      || (coords.j + 2 <= max && grid[coords.i]![coords.j + 1]!)
    if (!isWidthOK) image.width = 1

    // insert item
    grid[coords.i]![coords.j]! = false
    if (image.width == 2) grid[coords.i]![coords.j + 1]! = false
    if (image.height == 2) grid[coords.i + 1]![coords.j]! = false
    if (image.width == 2 && image.height == 2) {
      grid[coords.i + 1]![coords.j + 1]! = false
    }

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

    return image
  })
}

const filterImages = (images: InfiniteImages['items'][0]['images'], filters: Filters) => {
  const { categories, tags, metadata } = filters
  let filteredImages = images

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

  return filteredImages
}

//  ==============================
//              STORE
//  ==============================

interface ImageStore {
  selected: SelectedImage[]
  active: ActiveImage | null
  actions: {
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
  actions: {
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

//  ==================================
//              COMPONENTS
//  ==================================

function Image({ image }: { image: ImageProps }) {
  const { directory, filename, width, height, dateIso, id, ...props } = image

  const [isSelected, setSelected] = useState(false)
  const [isActive, setActive] = useState(false)
  const { select, deselect, activate } = useImageActions()
  const { setModalUrl } = useZoomActions()

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

  /* MOUSE EVENTS */

  const onMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target instanceof HTMLElement && e.target.tagName == 'DIV') {
      headerClickHandler()
      return // prevents long-click on the title from activating stuff
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
        data-center={`${directory}/${filename}`}
        title={dateIso} />
    </animated.div>
  )
}

export default function ImageGrid() {
  const filters = useAllFilters()
  const { data, isSuccess } = useInfiniteImages()
  if (isSuccess) console.log(`success!: pages= ${data.pages.length}`)

  const styles = css({
    '& > h1': {
      fontSize: '1.4rem',
      fontWeight: 'bold',
      marginTop: '2rem',
      _first: { marginTop: '1rem' },
    },
    '& > section': {
      display: 'grid',
      gridTemplateColumns: '125px 125px 125px 125px',
      gridAutoRows: '125px',
      rowGap: '5px',
      columnGap: '5px',
    },
  })

  return data?.pages.map(({ items }) =>
    items.map(({ date, images }) => {
      const filteredImages = filterImages(images, filters)
      const processedImages = prepImages(filteredImages)

      return (
        <div key={date} className={styles}>
          <h1>{date}</h1>
          <section>
            {processedImages.map((image) => <Image key={image.id} image={image} />)}
          </section>
        </div>
      )
    })
  )
}
