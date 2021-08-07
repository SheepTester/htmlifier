import { createElement as e, ReactNode } from './lib/react.ts'

export const link = (href: string, text: string) => e('a', { href }, text)

export const label = (...children: ReactNode[]) => e('label', null, ...children)

export const blockLabel = (...children: ReactNode[]) =>
  e('p', null, e('label', null, ...children))

export const download = (blob: Blob, name = 'result') => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}.${blob.type === 'text/html' ? 'html' : 'zip'}`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
