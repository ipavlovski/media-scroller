import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { useInfiniteImages } from '../apis/queries'
import { css } from '../styled-system/css'

export default function Footer() {
  const { ref, inView } = useInView()

  const { hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteImages()

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage()
  }, [inView, hasNextPage])

  const styles = css({
    display: 'flex',
    flexDir: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    fontSize: '3rem',
    textTransform: 'uppercase',
    borderTop: 'solid white',
  })
  return (
    <div className={styles} ref={ref}>
      <h3>This is a footer</h3>
      {isFetchingNextPage && <p>... loading ...</p>}
    </div>
  )
}
