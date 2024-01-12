import { CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { IconType } from 'react-icons'
import { BsCheckCircleFill } from 'react-icons/bs'
import { css } from '../styled-system/css'

export type DialogProps = {
  readonly dialogRef: HTMLDialogElement | null
  readonly containerRef: HTMLDivElement | null
}

export const Dialog = forwardRef<DialogProps,
  { icon: IconType; action: (name: string) => Promise<number> }>(
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

      const [, setTop] = useState<number | undefined>(0)

      useImperativeHandle(ref, () => ({
        get dialogRef() {
          return dialogRef.current
        },
        get containerRef() {
          return containerRef.current
        },
      }))

      useEffect(() => {
        console.log(`${containerRef.current?.getBoundingClientRect().top}px`)
        setTop(containerRef.current?.getBoundingClientRect().top)
      }, [containerRef.current?.getBoundingClientRect().top])

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
                  try {
                    const value = dialogRef.current?.querySelector('input')?.value
                    const result = (value != null && value.length > 0) && await props.action(value)
                    console.log(`Success. Result: ${result}`)
                    dialogRef.current?.close()
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Unknown error.'
                    console.log(msg)
                  }
                }} />
            </main>
          </dialog>
        </div>
      )
    },
  )
