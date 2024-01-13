import { useRef } from 'react'
import { BsJournal } from 'react-icons/bs'
import { TbCategory, TbCategoryPlus, TbTags, TbTagStarred } from 'react-icons/tb'
import { useCategories, useCreateCategory, useCreateTag, useTags } from '../apis/queries'
import { css } from '../styled-system/css'
import { Flex } from '../styled-system/jsx'
import { Dialog, DialogProps } from './dialog'
import { useImageActions, useImageSelection } from './images'

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

function CategoryResults() {
  const { data, isSuccess } = useCategories()
  return data?.length
    ? data?.map((v) => <p key={v.id}>{v.name}</p>)
    : <p>No categories.</p>
}

function TagResults() {
  const { data, isSuccess } = useTags()
  return data?.length
    ? data?.map((v) => <p key={v.id}>{v.name}</p>)
    : <p>No tags.</p>
}

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
  return <div className={styles} onClick={() => deselectAll()}>{imageSelection.length}</div>
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
