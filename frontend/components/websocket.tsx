import { useEffect, useRef, useState } from 'react'
import { TbBrandSocketIo } from 'react-icons/tb'
import { trpc } from '../apis/queries'

const PORT = 3000

export default function Websockets() {
  const [isPaused, setPause] = useState(false)
  const ws = useRef<WebSocket>()
  const utils = trpc.useUtils()
  
  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:${PORT}/`)
    ws.current.onopen = () => console.log('ws opened')
    ws.current.onclose = () => console.log('ws closed')

    const wsCurrent = ws.current

    return () => {
      wsCurrent.close()
    }
  }, [])

  useEffect(() => {
    if (!ws.current) return

    ws.current.onmessage = (event) => {
      // console.log(event)
      if (isPaused) return
      const message = JSON.parse(event.data)
      console.log(message)
      if (message instanceof Object && message.id != null) {
        utils.infiniteImages.invalidate()
      }
    }
  }, [isPaused])

  const clickHandler = () => {
    ws.current?.send('stuff')
  }

  return <TbBrandSocketIo size={'1.25rem'} onClick={clickHandler} />
}
