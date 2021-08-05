import { createElement as e, ChangeEvent } from '../lib/react.ts'

type TextFieldProps = {
  onChange: (value: string) => void
  name: string
  value: string
  type?: string
}

export const TextField = ({
  onChange,
  name,
  value,
  type = 'text'
}: TextFieldProps) => {
  return e('input', {
    type,
    name,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      onChange(event.target.value)
  })
}

type NumberFieldProps = {
  onChange: (value: number) => void
  name: string
  value: number
}

export const NumberField = ({ onChange, name, value }: NumberFieldProps) => {
  return e(TextField, {
    onChange: string => onChange(+string),
    name,
    value: String(value),
    type: 'number'
  })
}
