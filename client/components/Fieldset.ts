import { createElement as e, ReactNode } from '../lib/react.ts'

type Props = {
  label: ReactNode
  children?: ReactNode
}

export const Fieldset = ({ label, children }: Props) => {
  return e('fieldset', null, e('legend', null, label), children)
}
