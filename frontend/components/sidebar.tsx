import { useState } from 'react'
import { BsJournal, BsJournalPlus } from 'react-icons/bs'
import { TbCategory, TbCategoryPlus, TbTags, TbTagStarred } from 'react-icons/tb'
import { css } from '../styled-system/css'
import { Flex } from '../styled-system/jsx'

function TextInput({ setter }: { setter: React.Dispatch<React.SetStateAction<string>> }) {
  const styles = css({
    // marginLeft: '10rem',
    position: 'absolute',
    left: '8rem',
    zIndex: -1,
    borderRadius: '.5rem',
    padding: '.25rem',
    color: 'black',
  })

  return <input className={styles} type='text' onChange={(e) => setter(e.target.value)} />
}

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
  const styles = css({
    '& svg': {
      transition: 'color .2s ease-in-out',
      _hover: {
        color: 'green',
        transition: 'color .2s ease-in-out',
      },
    },
  })

  const [isShowing, setShowing] = useState(false)
  const [inputText, setInputText] = useState('')

  const handler = () => {
    setShowing(!isShowing)
  }

  return (
    <>
      <Flex mt={'2rem'} align={'center'} className={styles}>
        <Divider text='Categories' />
        <TbCategoryPlus size={'1.5rem'} onClick={handler}
          style={{ color: isShowing ? 'green' : undefined }} />
        {isShowing && <TextInput setter={setInputText} />}
      </Flex>
    </>
  )
}

function CategoryResults() {
  return <h3>category results</h3>
}

function TagsDivider() {
  const styles = css({
    '& svg': {
      transition: 'color .2s ease-in-out',
      _hover: {
        color: 'green',
        transition: 'color .2s ease-in-out',
      },
    },
  })

  const handler = () => {
    console.log('add new tag...')
  }

  return (
    <Flex mt={'2rem'} align={'center'} className={styles}>
      <Divider text='Tags' />
      <TbTagStarred size={'1.5rem'} onClick={handler} />
    </Flex>
  )
}

function TagResults() {
  return <h3>tag results</h3>
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

  const handler = () => {
    console.log('add new metadata...')
  }

  return (
    <Flex mt={'2rem'} align={'center'} className={styles}>
      <Divider text='Metadata' />
      <BsJournalPlus size={'1.25rem'} strokeWidth={0.25} onClick={handler} />
    </Flex>
  )
}

function MetadataResults() {
  return <h3>metadata results</h3>
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
