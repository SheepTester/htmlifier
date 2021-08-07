import { FootnotesContext } from '../contexts/footnotes.ts'
import {
  createElement as e,
  ReactNode,
  useContext,
  useEffect,
  useState
} from '../lib/react.ts'

type Props = {
  id: string
  children?: ReactNode
}

export const Footnote = ({ id, children }: Props) => {
  const [symbol] = useState(Symbol())

  const { addFootnote, removeFootnote } = useContext(FootnotesContext)
  useEffect(() => {
    addFootnote(symbol, { id, content: children })
    return () => {
      removeFootnote(symbol)
    }
  }, [])

  return e(
    'a',
    { id: `ref-${id}`, href: `#note-${id}` },
    e('sup', { className: 'footnote' }, '[Footnote]')
  )
}
