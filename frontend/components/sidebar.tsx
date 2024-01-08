import { css } from '../styled-system/css'

export default function Sidebar() {
  const styles = css({
    position: 'fixed',
    width: '5rem',
    '& p': {
      margin: '.5rem',
    },
  })

  return (
    <div className={styles}>
      <p>test1</p>
      <p>test2</p>
    </div>
  )
}