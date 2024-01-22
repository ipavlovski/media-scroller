import { MouseEventHandler, useEffect, useRef } from 'react'
import { BsJournal } from 'react-icons/bs'
import { TbCategory, TbCategoryPlus, TbTags, TbTagStarred } from 'react-icons/tb'
import { create } from 'zustand'
import { Categories, Tags, useCategories, useCreateCategory, useCreateTag,
  useDeleteImages, useTags, useUpdateImageCategories,
  useUpdateImageTags } from '../apis/queries'
import { css } from '../styled-system/css'
import { Flex } from '../styled-system/jsx'
import { Dialog, DialogProps } from './dialog'
import { SelectedImage, useImageActions, useImageSelection } from './images'
import { useToast } from './toast'
import Websockets from './websocket'

//  ===========================
//           STORE
//  ===========================

type FilterAction =
  | { type: 'tag'; tagId: number }
  | { type: 'category'; categoryId: number }
  | { type: 'metadata'; content: string }

export type Filters = {
  categories: number[]
  tags: number[]
  metadata: string[]
}

// metadata: Extract<Filter, { type: 'metadata' }>[]
interface SidebarStore {
  filters: Filters
  actions: {
    addFilter: (filter: FilterAction) => void
    removeFilter: (filter: FilterAction) => void
    setFilter: (filter: FilterAction) => void
  }
}

const useSidebarStore = create<SidebarStore>()((set, get) => ({
  filters: { categories: [], tags: [], metadata: [] },
  actions: {
    addFilter: (filter) =>
      set((state) => {
        switch (filter.type) {
          case 'category':
            return ({ filters: {
              ...state.filters,
              categories: [...state.filters.categories, filter.categoryId],
            } })
          case 'tag':
            return ({ filters: {
              ...state.filters,
              tags: [...state.filters.tags, filter.tagId],
            } })
          case 'metadata':
            return ({ filters: {
              ...state.filters,
              metadata: [...state.filters.metadata, filter.content],
            } })
        }
      }),
    removeFilter: (filter) =>
      set((state) => {
        switch (filter.type) {
          case 'category':
            return ({ filters: {
              ...state.filters,
              categories: [
                ...state.filters.categories.filter((v) => v != filter.categoryId),
              ],
            } })
          case 'tag':
            return ({ filters: {
              ...state.filters,
              tags: [...state.filters.tags.filter((v) => v != filter.tagId)],
            } })
          case 'metadata':
            return ({ filters: {
              ...state.filters,
              metadata: [...state.filters.metadata.filter((v) => v != filter.content)],
            } })
        }
      }),

    setFilter: (filter) =>
      set((state) => {
        switch (filter.type) {
          case 'category':
            return ({ filters: { ...state.filters, categories: [filter.categoryId] } })
          case 'tag':
            return ({ filters: { ...state.filters, tags: [filter.tagId] } })
          case 'metadata':
            return ({ filters: { ...state.filters, metadata: [filter.content] } })
        }
      }),
  },
}))

const useSidebarActions = () => useSidebarStore((state) => state.actions)
const useFilteredCategories = () => useSidebarStore((state) => state.filters.categories)
const useFilteredTags = () => useSidebarStore((state) => state.filters.tags)
const useFilteredMetadata = () => useSidebarStore((state) => state.filters.metadata)

export const useAllFilters = () => useSidebarStore((state) => state.filters)

//  ===========================
//           CATEGORIES
//  ===========================

type CategoryItemProps = Categories[0] & { imageIds: number[] }
function CategoryItem(props: { category: CategoryItemProps; selActive: boolean }) {
  const { category: { id, name, imageIds }, selActive } = props

  const updateImageCategories = useUpdateImageCategories()
  const { error, success } = useToast()
  const { getSelected } = useImageActions()
  const { addFilter, removeFilter, setFilter } = useSidebarActions()
  const filteredCategories = useFilteredCategories()

  const isSelected = filteredCategories.includes(id)

  const onClickName: MouseEventHandler = (e) => {
    if (selActive) return

    const filter = {
      type: 'category',
      categoryId: id,
    } satisfies Extract<FilterAction, { type: 'category' }>

    // isSelected ? removeFilter(filter) : addFilter(filter)

    if (e.shiftKey) {
      isSelected ? removeFilter(filter) : addFilter(filter)
    } else {
      ;(isSelected && filteredCategories.length > 1) || !isSelected
        ? setFilter(filter)
        : removeFilter(filter)
    }

    document.getSelection()?.removeAllRanges()
  }

  const onClickCount: MouseEventHandler = async (e) => {
    if (e.shiftKey) console.log('shift key pressed')
    console.log(`Adding a category ${name} to multiple images: ${imageIds.join(', ')}`)

    if (id == 0) {
      console.log('Cant add category with undefined.')
      return
    }

    try {
      const imageIds = getSelected().map((v) => v.id)
      console.log(`assign with categories:${id} and imageIds: ${imageIds.join(',')}`)
      const result = await updateImageCategories(id, imageIds)

      success(`Updated ${result.updateRecords?.length || 0} images with ${name}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error.'
      error(msg)
    }
  }

  const styles = css({
    display: 'flex',
    alignItems: 'center',
    paddingRight: '1rem',
    '& span': {
      width: '1.1rem',
      height: '1.1rem',
      display: 'block',
      fontSize: '.8rem',
      backgroundColor: 'slate.100',
      borderRadius: '1.1rem',
      color: 'slate.900',
      textAlign: 'center',
      lineHeight: '1rem',
      marginLeft: 'auto',
      cursor: 'pointer',
    },
  })

  return (
    <div className={styles}>
      <p
        key={id}
        style={{
          color: isSelected ? 'pink' : undefined,
          cursor: selActive ? undefined : 'pointer',
        }}
        onClick={onClickName}>
        {name}
      </p>
      {selActive && (
        <span
          title={'click to add all\nshift+click to subtract all'}
          onClick={onClickCount}
          style={{
            backgroundColor: imageIds.length > 0 ? 'yellow' : undefined,
            cursor: id != 0 ? undefined : 'default',
          }}>
          {imageIds.length > 0 ? imageIds.length : id != 0 ? '+' : null}
        </span>
      )}
    </div>
  )
}

const groupSelectionByCategories = (imageSelection: SelectedImage[]) => {
  const categoryAgg: { [key: number]: number[] } = {}
  imageSelection.forEach(({ id: imageId, categoryId }) => {
    categoryId ??= 0
    categoryAgg[categoryId] ??= []
    categoryAgg[categoryId].push(imageId)
  })
  return Object.entries(categoryAgg).map(([categoryId, imageIds]) => ({
    categoryId: parseInt(categoryId),
    imageIds,
  }))
}

function CategoryResults() {
  const { data: categories } = useCategories()
  const selection = useImageSelection()

  const defaultCategory = {
    id: 0,
    name: 'Uncategorized',
    description: 'Generated category',
    createdAt: '',
    color: 'teal',
    imageIds: [],
  } satisfies CategoryItemProps

  const allCategories = categories?.map((c) => ({ ...c, imageIds: [] as number[] })) ?? []
  allCategories.push(defaultCategory)

  groupSelectionByCategories(selection).forEach(({ categoryId, imageIds }) => {
    const match = allCategories?.find((category) => category.id == categoryId)
    if (match) match.imageIds = imageIds
  })

  return allCategories.map((category) => {
    const { id } = category
    return <CategoryItem category={category} key={id} selActive={selection.length > 0} />
  })
}

function CategoriesDivider() {
  const ref = useRef<DialogProps>(null)

  const createCategory = useCreateCategory()

  return (
    <Flex mt={'2rem'} align={'center'}>
      <Divider text='Categories' />
      <Dialog ref={ref} icon={TbCategoryPlus} action={createCategory} />
    </Flex>
  )
}

//  ===========================
//              TAGS
//  ===========================

type TagItemProps = Tags[0] & { imageIds: number[] }
function TagItem(props: { tag: TagItemProps; selActive: boolean }) {
  const { tag: { id, name, imageIds }, selActive } = props

  const updateImageTags = useUpdateImageTags()
  const { error, success } = useToast()
  const { getSelected } = useImageActions()
  const { addFilter, removeFilter, setFilter } = useSidebarActions()
  const filteredTags = useFilteredTags()

  const isSelected = filteredTags.includes(id)

  const onClickName: MouseEventHandler = (e) => {
    if (selActive) return

    const filter = {
      type: 'tag',
      tagId: id,
    } satisfies Extract<FilterAction, { type: 'tag' }>

    if (e.shiftKey) {
      isSelected ? removeFilter(filter) : addFilter(filter)
    } else {
      ;(isSelected && filteredTags.length > 1) || !isSelected
        ? setFilter(filter)
        : removeFilter(filter)
    }

    document.getSelection()?.removeAllRanges()
  }

  const onClickCount: MouseEventHandler = async (e) => {
    if (e.shiftKey) console.log('shift key pressed')
    console.log(`Adding a tag ${name} to multiple images: ${imageIds.join(', ')}`)
    if (id == 0) {
      console.log('Cant add tag with undefined.')
      return
    }

    try {
      const imageIds = getSelected().map((v) => v.id)
      console.log(`assign with tagId:${id} and imageIds: ${imageIds.join(',')}`)
      const result = await updateImageTags(id, imageIds)

      success(`Updated ${result.updateRecords?.length || 0} images with ${name}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error.'
      error(msg)
    }
  }

  const styles = css({
    display: 'flex',
    alignItems: 'center',
    paddingRight: '1rem',
    '& span': {
      width: '1.1rem',
      height: '1.1rem',
      display: 'block',
      fontSize: '.8rem',
      backgroundColor: 'slate.100',
      borderRadius: '1.1rem',
      color: 'slate.900',
      textAlign: 'center',
      lineHeight: '1rem',
      marginLeft: 'auto',
      cursor: 'pointer',
    },
  })

  return (
    <div className={styles}>
      <p
        key={id}
        onClick={onClickName}
        style={{
          color: isSelected ? 'pink' : undefined,
          cursor: selActive ? undefined : 'pointer',
        }}>
        {name}
      </p>
      {selActive && (
        <span
          title={'click to add all\nshift+click to subtract all'}
          onClick={onClickCount}
          style={{
            backgroundColor: imageIds.length > 0 ? 'yellow' : undefined,
            cursor: id != 0 ? undefined : 'default',
          }}>
          {imageIds.length > 0 ? imageIds.length : id != 0 ? '+' : null}
        </span>
      )}
    </div>
  )
}

const groupSelectionByTags = (imageSelection: SelectedImage[]) => {
  const tagAgg: { [key: number]: number[] } = {}
  imageSelection.forEach(({ id: imageId, tagIds }) => {
    // id=0 is the id of the default category
    if (tagIds.length == 0) tagIds = [0]

    return tagIds.forEach((tagId) => {
      tagAgg[tagId] ??= []
      tagAgg[tagId].push(imageId)
    })
  })
  return Object.entries(tagAgg).map(([tagId, imageIds]) => ({
    tagId: parseInt(tagId),
    imageIds,
  }))
}

function TagResults() {
  const { data: tags } = useTags()
  const selection = useImageSelection()

  const defaultTag = {
    id: 0,
    name: 'Untagged',
    description: 'Generated tag',
    createdAt: '',
    color: 'teal',
    imageIds: [],
  } satisfies TagItemProps

  // need 3 sections: default/pinned, selected, general
  const allTags = tags?.map((tag) => ({ ...tag, imageIds: [] as number[] })) ?? []
  allTags.push(defaultTag)

  groupSelectionByTags(selection).forEach(({ tagId, imageIds }) => {
    const match = allTags?.find((tag) => tag.id == tagId)
    if (match) match.imageIds = imageIds
  })

  return allTags.map((tag) => {
    const { id } = tag
    return <TagItem tag={tag} key={id} selActive={selection.length > 0} />
  })
}

function TagsDivider() {
  const ref = useRef<DialogProps>(null)

  const createTag = useCreateTag()

  return (
    <Flex mt={'2rem'} align={'center'}>
      <Divider text='Tags' />
      <Dialog ref={ref} icon={TbTagStarred} action={createTag} />
    </Flex>
  )
}

//  ===========================
//           METADATA
//  ===========================

function MetadataDivider() {
  const styles = css({
    '& svg': {
      transition: 'color .2s ease-in-out',
      _hover: {
        color: 'green',
        transition: 'color .2s ease-in-out',
      },
    },
  })

  return (
    <Flex mt={'2rem'} align={'center'} className={styles}>
      <Divider text='Metadata' />
    </Flex>
  )
}

function MetadataResults() {
  return <h3>...</h3>
}

//  ===========================
//           SEARCHBAR
//  ===========================
function Divider({ text }: { text: string }) {
  const styles = css({
    borderBottom: 'solid white 2px',
    width: '8rem',
    marginRight: '1rem',
    fontSize: '10px',
    letterSpacing: 'widest',
    textTransform: 'uppercase',
  })
  return (
    <div className={styles}>
      {text}
    </div>
  )
}

const useImageDeleteShortcut = () => {
  const { isPending, delete: deleteImages } = useDeleteImages()
  const { success, error } = useToast()

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (e.key == 'Delete') {
        try {
          const images = await deleteImages()
          success(`Deleted: ${images.length} images`)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error.'
          error(msg)
        }
      }

      if (e.key == ' ') {
        console.log('SPACE')
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return isPending
}

function DeleteIndicator() {
  const isLoading = useImageDeleteShortcut()

  return (
    <div>
      {isLoading && 'Loading...'}
    </div>
  )
}

function ImageCounter() {
  const styles = css({
    width: '1.5rem',
    height: '1.5rem',
    backgroundColor: 'slate.100',
    borderRadius: '2rem',
    color: 'slate.900',
    textAlign: 'center',
    lineHeight: '1.4rem',
    marginLeft: 'auto',
    cursor: 'pointer',
  })

  const imageSelection = useImageSelection()
  const { deselectAll } = useImageActions()
  return (
    <div className={styles}
      style={{ backgroundColor: imageSelection.length > 0 ? 'yellow' : undefined }}
      onClick={() => deselectAll()}>
      {imageSelection.length}
    </div>
  )
}

function SearchBar() {
  const styles = css({
    marginTop: '.5rem',
    width: '10rem',
    borderRadius: '.5rem',
    color: 'black',
    padding: '.25rem',
  })

  return (
    <div>
      <input className={styles} type='search' />
      <Flex mt='.5rem' gap='.25rem' mb='1.5rem'>
        <Websockets />
        <TbCategory size={'1.25rem'} />
        <TbTags size={'1.25rem'} />
        <BsJournal size={'1.25rem'} strokeWidth={0.25} />
        <DeleteIndicator />
        <ImageCounter />
      </Flex>
    </div>
  )
}

export default function Sidebar() {
  const styles = css({
    position: 'fixed',
    width: '10rem',
    marginX: '1rem',
  })

  return (
    <div className={styles}>
      <SearchBar />
      <CategoriesDivider />
      <CategoryResults />
      <TagsDivider />
      <TagResults />
      <MetadataDivider />
      <MetadataResults />
    </div>
  )
}
