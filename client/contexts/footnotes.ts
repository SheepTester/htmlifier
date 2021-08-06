import { createContext, ReactNode } from '../lib/react.ts'

export type Footnote = {
  id: string
  content: ReactNode
}

type ContextValue = {
  addFootnote: (id: symbol, content: Footnote) => void
  removeFootnote: (id: symbol) => void
}

export const FootnotesContext = createContext<ContextValue>({
  addFootnote: () => {
    throw new Error('Not implemented')
  },
  removeFootnote: () => {
    throw new Error('Not implemented')
  }
})
