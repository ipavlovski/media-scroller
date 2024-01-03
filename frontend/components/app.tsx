import { css } from '../styled-system/css'
import { Center, Flex } from '../styled-system/jsx'

export default function App() {
  const styles = css({
    backgroundColor: 'slate.900',
    color: 'slate.100',
    '& h1': {
      _hover: {
        background: 'blue',
        color: 'red'
      }
    }
  })

  return (
    <Flex width='100vw' height='100vh' flexDir='column' className={styles} alignItems='center'>
      <h1>Hello test.</h1>
    </Flex>
  )
}
