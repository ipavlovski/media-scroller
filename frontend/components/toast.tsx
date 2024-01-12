import { useEffect, useRef } from 'react'
import { MdCheckCircle, MdCircle, MdError, MdFlagCircle, MdInfo } from 'react-icons/md'
import { create } from 'zustand'
import { css } from '../styled-system/css'
import { Flex } from '../styled-system/jsx'

type ToastType = 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR'

type ToastItem = {
  type: ToastType
  msg: string
  millis: number
}

type ToastStore = {
  queue: ToastItem[]
  remove: (millis: number) => void
  actions: {
    info: (msg: string) => void
    success: (msg: string) => void
    warning: (msg: string) => void
    error: (msg: string) => void
  }
}

const add = (queue: ToastItem[], msg: string,
  type: ToastType) => [...queue, { type, msg, millis: Date.now() }]

const remove = (queue: ToastItem[], millis: number) =>
  queue.filter((toast) => toast.millis != millis)

const useToastStore = create<ToastStore>((set) => ({
  queue: [],
  remove: (millis) => set(({ queue }) => ({ queue: remove(queue, millis) })),
  actions: {
    warning: (msg) => set(({ queue }) => ({ queue: add(queue, msg, 'WARNING') })),
    info: (msg) => set(({ queue }) => ({ queue: add(queue, msg, 'INFO') })),
    success: (msg) => set(({ queue }) => ({ queue: add(queue, msg, 'SUCCESS') })),
    error: (msg) => set(({ queue }) => ({ queue: add(queue, msg, 'ERROR') })),
  },
}))

function Toast(props: ToastItem & { ind: number }) {
  const styles = css({
    backgroundColor: 'white',
    color: 'black',
    position: 'fixed',
    width: '150px',
    height: '60px',
    right: '10px',
    rounded: '.5rem',
    padding: '.25rem',
    '& svg': {
      fontSize: '1.5rem',
    },
    '& h3': {
      fontWeight: 'bolder',
    },
  })
  const timerID = useRef<ReturnType<typeof setTimeout>>()
  const remove = useToastStore((state) => state.remove)

  const handleDismiss = () => {
    remove(props.millis)
  }

  useEffect(() => {
    timerID.current = setTimeout(() => {
      handleDismiss()
    }, 12000)

    return () => {
      clearTimeout(timerID.current)
    }
  }, [])

  let toastIcon = <MdCircle color='black' />
  switch (props.type) {
    case 'INFO':
      toastIcon = <MdInfo color='blue' />
      break
    case 'SUCCESS':
      toastIcon = <MdCheckCircle color='green' />
      break
    case 'WARNING':
      toastIcon = <MdFlagCircle color='orange' />
      break
    case 'ERROR':
      toastIcon = <MdError color='red' />
      break
    default:
      props.type satisfies never
      break
  }

  return (
    <div className={styles} style={{ top: `${(70 * props.ind + 10)}px` }} onClick={handleDismiss}>
      <Flex align='center' gap='.5rem'>
        {toastIcon}
        <h3>{props.type}</h3>
      </Flex>
      {props.msg}
    </div>
  )
}

export function Toaster() {
  const queue = useToastStore((store) => store.queue)
  const styles = css({})

  return (
    <div className={styles}>
      {queue.map((toast, ind) => <Toast {...toast} ind={ind} key={toast.millis} />)}
    </div>
  )
}

export const useToast = () => useToastStore((store) => store.actions)
