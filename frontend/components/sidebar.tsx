import { forwardRef, HTMLProps, ReactPropTypes, useEffect, useImperativeHandle, useRef,
  useState } from 'react'
import { IconType } from 'react-icons'
import { BsJournal, BsJournalPlus } from 'react-icons/bs'
import { TbCategory, TbCategoryPlus, TbTags, TbTagStarred } from 'react-icons/tb'
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

// the sliding text input: will close by 'esc' or
// automatically
type PopoverInputProps = {
  setText: React.Dispatch<React.SetStateAction<string>>
  setShowing: React.Dispatch<React.SetStateAction<boolean>>
  isShowing: boolean
}
function PopoverInput({ setText, setShowing, isShowing }: PopoverInputProps) {
  const ref = useRef<HTMLDivElement>(null)

  const styles = css({
    zIndex: -1,
    width: '200px',
    height: '200px',
    position: 'absolute',
    left: '0',
    top: '0',
    backgroundColor: 'white',
    color: 'black',
    padding: '1rem',

    '& input': {
      width: '10rem',
      borderRadius: '.5rem',
      border: 'solid 2px black',
      padding: '.25rem',
      color: 'black',
    },
  })

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      console.log('clicked on the elemnt')
      isShowing && setShowing(false)
      // console.log(ref, ref.current?.open, event.target)
      // if (!ref.current?.open) {
      //   console.log('closing...')
      //   ref.current?.close()
      // }
    }

    window.addEventListener('click', listener)

    return () => {
      console.log('removing event listener')
      window.removeEventListener('click', listener)
    }
  }, [])

  return (
    <div className={styles}>
      <main>
        <h2>this is a header</h2>
      </main>
      <input type='text' onChange={(e) => setText(e.target.value)} />
      <button>OK</button>
    </div>
  )
}


type CustomDialogProps = {
  readonly dialogRef: HTMLDialogElement | null
  readonly containerRef: HTMLDivElement | null
}
const CustomDialog2 = forwardRef<CustomDialogProps, {}>((props, ref) => {
  const styles = css({})

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

  const iconClickHandler = () => {
    dialogRef.current?.showModal()
    console.log('Click on dialog handler...')
  }

  return (
    <div ref={containerRef}>
      <TbCategoryPlus size={'1.5rem'} onClick={iconClickHandler} />
      <dialog ref={dialogRef} onClick={(e) => e.currentTarget.close()} style={{
        left: `${containerRef.current?.getBoundingClientRect().left}px`,
        top: `${containerRef.current?.getBoundingClientRect().top}px`,
      }}>
        <div onClick={(e) => e.stopPropagation()} className={styles}>
          <main>
            main part
          </main>
          <input type='text' autoFocus={true} />
          <footer>
            <button onClick={() => dialogRef.current?.close()}>close</button>
          </footer>
        </div>
      </dialog>
    </div>
  )
})

const CustomDialog = forwardRef<HTMLDialogElement, {}>((props, dialogRef) => {
  const ref = useRef<HTMLDialogElement>(null)
  useImperativeHandle(dialogRef, () => ref.current as HTMLDialogElement)

  const styles = css({
    height: '20rem',
    width: '10rem',
    padding: '1rem',
    '& input': {
      width: '8rem',
      border: 'solid 2px black',
    },
  })

  return (
    <dialog ref={ref} onClick={(e) => e.currentTarget.close()}
      style={{ left: '200px', top: '400px' }}>
      <div onClick={(e) => e.stopPropagation()} className={styles}>
        <main>
          main part
        </main>
        <input type='text' autoFocus={true} />
        <footer>
          <button onClick={() => ref.current?.close()}>close</button>
        </footer>
      </div>
    </dialog>
  )
})

function CategoriesDivider() {
  const styles = css({
    '& svg': {
      transition: 'color .2s ease-in-out',
      _hover: {
        color: 'green',
        transition: 'color .2s ease-in-out',
      },
    },
    '& .popover-wrapper': {
      position: 'relative',
    },
  })

  const [isShowing, setShowing] = useState(false)
  const [inputText, setInputText] = useState('')

  // const dialogRef = useRef<HTMLDialogElement>(null)
  const ref = useRef<CustomDialogProps>(null)

  // const handler = () => {
  //   dialogRef.current?.showModal()
  //   // setShowing(!isShowing)
  // }

  return (
    <>
      <Flex mt={'2rem'} align={'center'} className={styles}>
        <Divider text='Categories' />
        <div className='popover-wrapper'>
          <CustomDialog2 ref={ref} />

          {
            /* <TbCategoryPlus size={'1.5rem'} onClick={handler}
            style={{ color: isShowing ? 'green' : undefined }} />

          <CustomDialog ref={dialogRef} /> */
          }

          {
            /* {isShowing && (
            <PopoverInput setText={setInputText} setShowing={setShowing} isShowing={isShowing} />
          )} */
          }
        </div>
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
