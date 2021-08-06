import { createElement as e, useEffect, useRef } from '../lib/react.ts'

type Props = {
  onClick: () => void
  disabled?: boolean
}

export const HtmlifyBtn = ({ onClick, disabled = false }: Props) => {
  const otherBtn = useRef<HTMLButtonElement>()
  useEffect(() => {
    const button = document.getElementById('other-htmlify-btn')
    if (button instanceof HTMLButtonElement) {
      otherBtn.current = button
    }
  })

  useEffect(() => {
    if (otherBtn.current) {
      otherBtn.current.addEventListener('click', onClick)
    }
    return () => {
      if (otherBtn.current) {
        otherBtn.current.removeEventListener('click', onClick)
      }
    }
  }, [onClick])

  useEffect(() => {
    if (otherBtn.current) {
      otherBtn.current.disabled = disabled
    }
  }, [disabled])

  return e('input', {
    type: 'submit',
    value: 'HTMLify',
    id: 'htmlify',
    disabled
  })
}
