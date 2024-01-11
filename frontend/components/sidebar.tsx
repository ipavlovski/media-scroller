import { CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { IconType } from 'react-icons'
import { BsCheckCircleFill, BsJournal, BsJournalPlus } from 'react-icons/bs'
import { TbCategory, TbCategoryPlus, TbTags, TbTagStarred } from 'react-icons/tb'
import { trpc } from '../apis/trpc'
import { css } from '../styled-system/css'
import { Flex } from '../styled-system/jsx'

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

type CustomDialogProps = {
  readonly dialogRef: HTMLDialogElement | null
  readonly containerRef: HTMLDivElement | null
}
const CustomDialog = forwardRef<CustomDialogProps, { icon: IconType; action: (name: string) => void }>(
  (props, ref) => {
    const styles = css({
      '& dialog': {
        borderRadius: '2rem',
        marginLeft: '2rem',
        marginTop: '.75rem',
      },
      '& main': {
        display: 'flex',
        alignItems: 'center',
        gap: '.25rem',
        padding: '.25rem',
      },
      '& input': {
        width: '10rem',
        height: '1.5rem',
        border: 'solid 2px black',
        borderRadius: '1rem',
        paddingLeft: '.5rem',
        paddingRight: '.5rem',
      },
      '& svg': {
        fontSize: '1.5rem',
        transition: 'color .2s ease-in-out',
        _hover: {
          color: 'green',
          transition: 'color .2s ease-in-out',
        },
      },
    })

    const dialogRef = useRef<HTMLDialogElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const [left, setLeft] = useState<number | undefined>(0)

    useImperativeHandle(ref, () => ({
      get dialogRef() {
        return dialogRef.current
      },
      get containerRef() {
        return containerRef.current
      },
    }))

    useEffect(() => {
      console.log(`${containerRef.current?.getBoundingClientRect().left}px`)
      setLeft(containerRef.current?.getBoundingClientRect().left)
    }, [containerRef.current?.getBoundingClientRect().left])

    const dialogOffsets: CSSProperties = {
      left: `${containerRef.current?.getBoundingClientRect().left}px`,
      top: `${containerRef.current?.getBoundingClientRect().top}px`,
    }

    return (
      <div ref={containerRef} className={styles}>
        <props.icon size={'1.5rem'} onClick={() => dialogRef.current?.showModal()} />
        <dialog ref={dialogRef} onClick={(e) => e.currentTarget.close()} style={dialogOffsets}
          onClose={() => {
            const input = dialogRef.current?.querySelector('input')
            if (input != null) input.value = ''
          }}>
          <main onClick={(e) => e.stopPropagation()}>
            <input type='text' autoFocus={true} />
            <BsCheckCircleFill
              onClick={async () => {
                // dialogRef.current?.close()
                const value = dialogRef.current?.querySelector('input')?.value
                if (value != null && value.length > 0) props.action(value)
                console.log('Should check for result before close...')
              }} />
          </main>
        </dialog>
      </div>
    )
  },
)

const useCreateCategory = () => {
  const createCategory = trpc.createCategory.useMutation()

  return async (name: string) => {
    return createCategory.mutateAsync({ name })
  }
}

const useCreateTag = () => {
  const createTag = trpc.createTag.useMutation()

  return async (name: string) => {
    return createTag.mutateAsync({ name })
  }
}

function CategoriesDivider() {
  const ref = useRef<CustomDialogProps>(null)

  const createCategory = useCreateCategory()

  return (
    <Flex mt={'2rem'} align={'center'}>
      <Divider text='Categories' />
      <CustomDialog ref={ref} icon={TbCategoryPlus} action={createCategory} />
    </Flex>
  )
}

function TagsDivider() {
  const ref = useRef<CustomDialogProps>(null)

  const createTag = useCreateTag()


  return (
    <Flex mt={'2rem'} align={'center'}>
      <Divider text='Tags' />
      <CustomDialog ref={ref} icon={TbTagStarred} action={createTag} />
    </Flex>
  )
}

function CategoryResults() {
  const { data, isSuccess } = trpc.getCategories.useQuery()
  return data?.length
    ? data?.map((v) => <p key={v.id}>{v.name}</p>)
    : <p>No categories.</p>
}

function TagResults() {
  const { data, isSuccess } = trpc.getTags.useQuery()
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
