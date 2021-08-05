import { createElement as e } from './lib/react.ts'

export const link = (href: string, text: string) => e('a', { href }, text)
