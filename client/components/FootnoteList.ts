import { Footnote } from '../contexts/footnotes.ts'
import { createElement as e } from '../lib/react.ts'

type Props = {
  footnotes: Footnote[]
}

export const FootnoteList = ({ footnotes }: Props) => {
  return e(
    'div',
    { className: 'footnotes' },
    footnotes.map(({ id, content }) =>
      e(
        'p',
        { key: id, id: `note-${id}` },
        e(
          'a',
          { href: `#ref-${id}` },
          e('sup', { className: 'footnote' }, '[Jump back up]')
        ),
        content
      )
    )
  )
}
