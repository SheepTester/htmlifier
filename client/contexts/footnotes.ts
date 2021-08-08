import { createContext, ReactNode } from '../lib/react.ts'

export type Footnote = {
  id: string
  content: ReactNode
}

type ContextValue = {
  footnotes: Map<symbol, Footnote>
}

export const FootnotesContext = createContext<ContextValue>({
  footnotes: new Map()
})
