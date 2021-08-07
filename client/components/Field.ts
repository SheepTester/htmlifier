import { OptionsContext } from '../contexts/options.ts'
import {
  createElement as e,
  ChangeEvent,
  useContext,
  useState
} from '../lib/react.ts'
import { NumberOptions, StringOptions } from '../options.ts'

type FieldProps = {
  onChange: (value: string) => void
  name: string
  placeholder?: string
  value: string
  type?: string
}

const Field = ({
  onChange,
  name,
  placeholder,
  value,
  type = 'text'
}: FieldProps) => {
  return e('input', {
    type,
    id: name,
    name,
    placeholder,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value)
    }
  })
}

type TextFieldProps<K extends keyof StringOptions> = {
  name: K
  placeholder?: string
  type?: string
}

export const TextField = <K extends keyof StringOptions>({
  name,
  placeholder,
  type
}: TextFieldProps<K>) => {
  const { options, onChange } = useContext(OptionsContext)
  return e(Field, {
    onChange: string => onChange(name, string),
    name,
    placeholder,
    value: String(options[name]),
    type
  })
}

type NumberFieldProps<K extends keyof NumberOptions> = {
  name: K
  placeholder?: number
}

export const NumberField = <K extends keyof NumberOptions>({
  name,
  placeholder
}: NumberFieldProps<K>) => {
  const { options, onChange } = useContext(OptionsContext)
  const [value, setValue] = useState(String(options[name]))
  return e(Field, {
    onChange: string => {
      setValue(string)
      onChange(name, +string)
    },
    name,
    placeholder: placeholder !== undefined ? String(placeholder) : '',
    value,
    type: 'number'
  })
}
