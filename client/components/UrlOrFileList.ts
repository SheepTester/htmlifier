import { OptionsContext } from '../contexts/options.ts'
import {
  createElement as e,
  ChangeEvent,
  useContext,
  useState,
  Fragment
} from '../lib/react.ts'
import { ListOptions } from '../options.ts'

let uniqueId = 0

type Item =
  | {
      type: 'url'
      content: string
      id: number
    }
  | {
      type: 'file'
      file?: File
      id: number
    }

type Props<K extends keyof ListOptions> = {
  name: K
  placeholder?: string
  accept?: string
}

export const UrlOrFileList = <K extends keyof ListOptions>({
  name,
  placeholder,
  accept
}: Props<K>) => {
  const { options, onChange } = useContext(OptionsContext)

  const [items, setItems] = useState<Item[]>(() => {
    return options[name].map(item =>
      typeof item === 'string'
        ? { type: 'url', content: item, id: uniqueId++ }
        : { type: 'file', file: item, id: uniqueId++ }
    )
  })

  const handleNewItems = (newItems: Item[]) => {
    setItems(newItems)
    onChange(
      name,
      newItems
        .map(item => (item.type === 'url' ? item.content : item.file))
        .filter((item): item is string | File => item !== undefined)
    )
  }

  return e(
    Fragment,
    null,
    e(
      'ul',
      null,
      items.map(item => {
        const id = item.id
        return e(
          'li',
          { key: item.id },
          e(
            'button',
            {
              className: 'remove-item-btn',
              type: 'button',
              ariaLabel: `Remove ${item.type}`,
              onClick: () => {
                handleNewItems(items.filter(item => item.id !== id))
              }
            },
            '×'
          ),
          ' ',
          item.type === 'url'
            ? e('input', {
                type: 'url',
                placeholder,
                value: item.content,
                onChange: (event: ChangeEvent<HTMLInputElement>) => {
                  handleNewItems(
                    items.map(item =>
                      item.id === id
                        ? { ...item, content: event.target.value }
                        : item
                    )
                  )
                }
              })
            : e('input', {
                type: 'file',
                accept,
                onChange: (event: ChangeEvent<HTMLInputElement>) => {
                  handleNewItems(
                    items.map(item =>
                      item.id === id
                        ? { ...item, file: event.target.files?.[0] }
                        : item
                    )
                  )
                }
              })
        )
      }),
      e(
        'li',
        { className: 'add-list-buttons' },
        e(
          'button',
          {
            className: 'add-url-btn',
            type: 'button',
            onClick: () => {
              handleNewItems([
                ...items,
                { type: 'url', content: '', id: uniqueId++ }
              ])
            }
          },
          'Add by URL'
        ),
        ' ',
        e(
          'button',
          {
            className: 'add-file-btn',
            type: 'button',
            onClick: () => {
              handleNewItems([...items, { type: 'file', id: uniqueId++ }])
            }
          },
          'Add by selecting a file'
        )
      )
    )
  )
}
