import { css } from '../styled-system/css'

function SearchBar() {
  const styles = css({
    marginX: '1rem',
    marginTop: '.5rem',
    width: '10rem',
    borderRadius: '.5rem'
  })


  return <input className={styles} type='search' />
}

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
      <SearchBar />
      <p>test1</p>
      <p>test2</p>
    </div>
  )
}
