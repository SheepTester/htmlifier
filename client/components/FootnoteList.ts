import { createElement as e, ReactNode } from '../lib/react.ts'

type Props = {
  getFootnotes: () => [string, ReactNode][]
}

export const FootnoteList = ({ getFootnotes }: Props) => {
  return e(
    'div',
    { className: 'footnotes' },
    getFootnotes().map(([id, content]) =>
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
