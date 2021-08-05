import { createElement as e, ReactNode } from '../lib/react.ts'

type Props = {
  onChange: (value: string) => void
  name: string
  label: string
  options: Record<string, ReactNode>
  checked: string
}

export const RadioGroup = ({
  onChange,
  name,
  label,
  options,
  checked
}: Props) => {
  return e(
    'fieldset',
    { className: 'radio-group' },
    e('label', null, label),
    Object.entries(options).map(([value, label]) =>
      e(
        'p',
        null,
        e('input', {
          type: 'radio',
          name,
          checked: value === checked,
          onChange: () => onChange(value)
        }),
        label
      )
    )
  )
}
