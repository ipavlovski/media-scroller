import { MouseEventHandler, useRef } from 'react'
import { BsJournal } from 'react-icons/bs'
import { TbCategory, TbCategoryPlus, TbTags, TbTagStarred } from 'react-icons/tb'
import { Categories, Tags, useCategories, useCreateCategory, useCreateTag, useTags,
  useUpdateImageCategories, useUpdateImageTags } from '../apis/queries'
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

  const updateImageCategories = useUpdateImageCategories()
  const { error, success } = useToast()
  const { getSelected } = useImageActions()

  const styles = css({ display: 'flex', alignItems: 'center', paddingRight: '1rem',
    '& span': { width: '1.1rem', height: '1.1rem', display: 'block', fontSize: '.8rem',
      backgroundColor: 'slate.100', borderRadius: '1.1rem', color: 'slate.900',
      textAlign: 'center', lineHeight: '1rem', marginLeft: 'auto', cursor: 'pointer' } })

  const onClick: MouseEventHandler = async (e) => {
    if (e.shiftKey) console.log('shift key pressed')
    console.log(`Adding a category ${name} to multiple images: ${imageIds.join(', ')}`)
    if (id == 0) {
      console.log('Cant add category with undefined.')
      return
    }

    try {
      const imageIds = getSelected().map((v) => v.id)
      console.log(
        `calling assignment with categories:${id} and imageIds: ${imageIds.join(',')}`,
      )
      const result = await updateImageCategories(id, imageIds)
      success(`Updated ${result.updateRecords?.length || 0} images with ${name}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error.'
      error(msg)
    }
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
  const { data: categories } = useCategories()
  const imageSelection = useImageSelection()

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

function TagItem({ tag, selActive }: { tag: TagItemProps; selActive: boolean }) {
  const { id, name, imageIds } = tag
  const len = imageIds.length

  const updateImageTags = useUpdateImageTags()
  const { error, success } = useToast()
  const { getSelected } = useImageActions()

  const onClick: MouseEventHandler = async (e) => {
    if (e.shiftKey) console.log('shift key pressed')
    console.log(`Adding a tag ${name} to multiple images: ${imageIds.join(', ')}`)
    if (id == 0) {
      console.log('Cant add tag with undefined.')
      return
    }

    try {
      const imageIds = getSelected().map((v) => v.id)
      console.log(
        `calling assignment with tagId:${id} and imageIds: ${imageIds.join(',')}`,
      )
      const result = await updateImageTags(id, imageIds)

      success(`Updated ${result.updateRecords?.length || 0} images with ${name}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error.'
      error(msg)
    }
  }

  const styles = css({ display: 'flex', alignItems: 'center', paddingRight: '1rem',
    '& span': { width: '1.1rem', height: '1.1rem', display: 'block', fontSize: '.8rem',
      backgroundColor: 'slate.100', borderRadius: '1.1rem', color: 'slate.900',
      textAlign: 'center', lineHeight: '1rem', marginLeft: 'auto', cursor: 'pointer' } })

  return (
    <div className={styles}>
      <p key={id}>{name}</p>
      {selActive && (
        <span
          title={'click to add all\nshift+click to subtract all'}
          onClick={onClick}
          style={{
            backgroundColor: len > 0 ? 'yellow' : undefined,
            cursor: id != 0 ? undefined : 'default',
          }}>
          {len > 0 ? len : id != 0 ? '+' : null}
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
  const imageSelection = useImageSelection()

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

  groupSelectionByTags(imageSelection).forEach(({ tagId, imageIds }) => {
    const match = allTags?.find((tag) => tag.id == tagId)
    if (match) match.imageIds = imageIds
  })

  return allTags.map((tag) => {
    return <TagItem tag={tag} key={tag.id} selActive={imageSelection.length > 0} />
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
