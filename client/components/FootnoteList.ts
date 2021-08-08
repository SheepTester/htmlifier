import { Footnote } from '../contexts/footnotes.ts'
import { createElement as e } from '../lib/react.ts'

type Props = {
  getFootnotes: () => Footnote[]
}

export const FootnoteList = ({ getFootnotes }: Props) => {
  return e(
    'div',
    { className: 'footnotes' },
    getFootnotes().map(({ id, content }) =>
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
