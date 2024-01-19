import { useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import { css } from '../styled-system/css'

const fromServerFull = (dirImg: string) => `http://localhost:3000/full/${dirImg}`

interface ZoomStore {
  modalUrl: string
  actions: {
    setModalUrl: (url: string) => void
  }
}

const useZoomStore = create<ZoomStore>()((set) => ({
  modalUrl: '',
  actions: {
    setModalUrl: (url) => set((state) => ({ modalUrl: url })),
  },
}))

export const useZoomActions = () => useZoomStore((state) => state.actions)

export default function ZoomView() {
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

  const modalUrl = useZoomStore((store) => store.modalUrl)
  const { setModalUrl } = useZoomActions()

  const ref = useRef<HTMLDialogElement>(null)

  const [{ left, right }, setLinks] = useState<{ left?: string; right?: string }>({})

  useEffect(() => {
    if (!ref || modalUrl == '') return
    ref.current?.showModal()

    const imgNodeList = document.querySelectorAll('img[data-center]')
    const allImages = Array.from(imgNodeList)
    const centerInd = allImages.findIndex((v) =>
      v.getAttribute('data-center') == modalUrl
    )

    const left = centerInd != -1 && centerInd - 1 >= 0
      ? allImages.at(centerInd - 1)?.getAttribute('data-center')
      : undefined

    const right = centerInd != -1 && centerInd + 1 < allImages.length
      ? allImages.at(centerInd + 1)?.getAttribute('data-center')
      : undefined

    setLinks({
      left: left || undefined,
      right: right || undefined,
    })
  }, [modalUrl])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
