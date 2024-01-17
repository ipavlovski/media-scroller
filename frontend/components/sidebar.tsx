import { MouseEventHandler, useRef } from 'react'
import { BsJournal } from 'react-icons/bs'
import { TbCategory, TbCategoryPlus, TbTags, TbTagStarred } from 'react-icons/tb'
import { image } from '../../db/handlers'
import { Categories, Tags, useCategories, useCreateCategory, useCreateTag, useTags,
  useUpdateImageTags } from '../apis/queries'
import { css } from '../styled-system/css'
import { Flex } from '../styled-system/jsx'
import { Dialog, DialogProps } from './dialog'
import { SelectedImage, useImageActions, useImageSelection } from './images'
import { useToast } from './toast'

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

//  ===========================
//           CATEGORIES
//  ===========================

type CategoryItemProps = Categories[0] & { imageIds: number[] }

function CategoryItem(props: { category: CategoryItemProps; selActive: boolean }) {
  const { category: { id, name, imageIds }, selActive } = props

  const len = imageIds.length

  const styles = css({ display: 'flex', alignItems: 'center', paddingRight: '1rem',
    '& span': { width: '1.1rem', height: '1.1rem', display: 'block', fontSize: '.8rem',
      backgroundColor: 'slate.100', borderRadius: '1.1rem', color: 'slate.900',
      textAlign: 'center', lineHeight: '1rem', marginLeft: 'auto', cursor: 'pointer' } })

  const onClick: MouseEventHandler = async (e) => {
    if (e.shiftKey) console.log('shift key pressed')
    console.log(`Adding a category ${name} to multiple images: ${imageIds.join(', ')}`)
  }

  return (
    <div className={styles}>
      <p key={id}>{name}</p>
      {selActive && (
        <span
          title={'click to add all\nshift+click to subtract all'}
          onClick={onClick}
          style={{ backgroundColor: len > 0 ? 'yellow' : undefined }}>
          {len > 0 ? len : `+`}
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
  const { data: categories, isSuccess } = useCategories()
  const imageSelection = useImageSelection()

  const defaultCategory = {
    id: 0,
    name: 'Uncategorized',
    description: 'Generated category',
    createdAt: '',
    color: 'teal',
    imageIds: [],
  } satisfies CategoryItemProps

  const allCategories = categories?.map((category) => ({
    ...category,
    imageIds: [] as number[],
  })) ?? []
  allCategories.push(defaultCategory)

  groupSelectionByCategories(imageSelection).forEach(({ categoryId, imageIds }) => {
    const match = allCategories?.find((category) => category.id == categoryId)
    if (match) match.imageIds = imageIds
  })

  return allCategories.map((category) => {
    return (
      <CategoryItem category={category} key={category.id}
        selActive={imageSelection.length > 0} />
    )
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

function TagItem(
  { tag, inSelectionMode }: { tag: TagItemProps; inSelectionMode: boolean },
) {
  const updateImageTags = useUpdateImageTags()
  const { error, success } = useToast()
  const { getSelected } = useImageActions()

  const onClick: MouseEventHandler = async (e) => {
    if (e.shiftKey) console.log('shift key pressed')
    console.log(`Adding a tag ${tag.name} to multiple images: ${tag.imageIds.join(', ')}`)

    try {
      const imageIds = getSelected().map((v) => v.id)
      console.log(
        `calling assignment with tagId:${tag.id} and imageIds: ${imageIds.join(',')}`,
      )
      const result = await updateImageTags(tag.id, imageIds)
      success(`Updated ${result.images?.length || 0} images with ${tag.name}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error.'
      error(msg)
    }
  }

  const len = tag.imageIds.length

  const styles = css({ display: 'flex', alignItems: 'center', paddingRight: '1rem',
    '& span': { width: '1.1rem', height: '1.1rem', display: 'block', fontSize: '.8rem',
      backgroundColor: 'slate.100', borderRadius: '1.1rem', color: 'slate.900',
      textAlign: 'center', lineHeight: '1rem', marginLeft: 'auto', cursor: 'pointer' } })

  return (
    <div className={styles}>
      <p key={tag.id}>{tag.name}</p>
      {inSelectionMode && (
        <span
          title={'click to add all\nshift+click to subtract all'}
          onClick={onClick}
          style={{ backgroundColor: len > 0 ? 'yellow' : undefined }}>
          {len > 0 ? len : `+`}
        </span>
      )}
    </div>
  )
}

const groupSelectionByTags = (imageSelection: SelectedImage[]) => {
  const tagAgg: { [key: number]: number[] } = {}
  imageSelection.forEach(({ id: imageId, tagIds }) => {
    tagIds.forEach((tagId) => ((tagAgg[tagId] ??= []), tagAgg[tagId].push(imageId)))
  })
  return Object.entries(tagAgg).map(([tagId, imageIds]) => ({ tagId: parseInt(tagId),
    imageIds })
  )
}

function TagResults() {
  const { data: tags, isSuccess } = useTags()
  const imageSelection = useImageSelection()

  // need 3 sections: default/pinned, selected, general
  const tagsWithSelection = tags?.map((tag) => ({ ...tag, imageIds: [] as number[] }))
    ?? []
  groupSelectionByTags(imageSelection).forEach(({ tagId, imageIds }) => {
    const match = tagsWithSelection?.find((tag) => tag.id == tagId)
    if (match) match.imageIds = imageIds
  })

  return tagsWithSelection.map((tag) => {
    return <TagItem tag={tag} key={tag.id} inSelectionMode={imageSelection.length > 0} />
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
  return <h3>metadata results</h3>
}

//  ===========================
//           SEARCHBAR
//  ===========================

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
        <TbCategory size={'1.25rem'} />
        <TbTags size={'1.25rem'} />
        <BsJournal size={'1.25rem'} strokeWidth={0.25} />
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
