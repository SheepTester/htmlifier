import { createContext, ReactNode } from '../lib/react.ts'

type ContextValue = {
  footnotes: Map<string, ReactNode>
}

export const FootnotesContext = createContext<ContextValue>({
  footnotes: new Map()
})
