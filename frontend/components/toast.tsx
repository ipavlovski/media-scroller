import { useEffect, useRef } from 'react'
import { IconType } from 'react-icons/lib'
import { MdCheckCircle, MdError, MdInfo } from 'react-icons/md'
import { create } from 'zustand'
import { css } from '../styled-system/css'

type ToastItem = {
  icon: IconType
  msg: string
  millis: number
}

type ToastStore = {
  queue: ToastItem[]
  remove: (millis: number) => void
  actions: {
    info: (msg: string) => void
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

const useToastStore = create<ToastStore>((set) => ({
  queue: [],
  remove: (millis) =>
    set((state) => ({ queue: state.queue.filter((toast) => toast.millis != millis) })),
  actions: {
    info: (msg) =>
      set(({ queue }) => ({ queue: [...queue, { icon: MdInfo, msg, millis: Date.now() }] })),
    success: (msg) =>
      set(({ queue }) => ({ queue: [...queue, { icon: MdCheckCircle, msg, millis: Date.now() }] })),
    error: (msg) =>
      set(({ queue }) => ({ queue: [...queue, { icon: MdError, msg, millis: Date.now() }] })),
  },
}))

function Toast(props: ToastItem & { ind: number }) {
  const styles = css({
    backgroundColor: 'white',
    color: 'black',
    position: 'fixed',
    width: '100px',
    height: '50px',
    right: '10px',
  })
  const timerID = useRef<ReturnType<typeof setTimeout>>()
  const remove = useToastStore((state) => state.remove)

  const handleDismiss = () => {
    remove(props.millis)
  }

  useEffect(() => {
    timerID.current = setTimeout(() => {
      handleDismiss()
    }, 4000)

    return () => {
      clearTimeout(timerID.current)
    }
  }, [])

  return (
    <div className={styles} style={{ top: `${75 * props.ind}px` }}>
      <props.icon />
      {props.msg}
    </div>
  )
}

export function Toaster() {
  const queue = useToastStore((store) => store.queue)
  const styles = css({
    position: 'fixed',
  })

  return (
    <div className={styles}>
      {queue.map((toast, ind) => <Toast {...toast} ind={ind} key={toast.millis} />)}
    </div>
  )
}

export const useToast = () => useToastStore((store) => store.actions)
