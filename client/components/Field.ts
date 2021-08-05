import { OptionsContext } from '../contexts/options.ts'
import { createElement as e, ChangeEvent, useContext } from '../lib/react.ts'
import {
  ConversionOptions,
  NumberOptions,
  OnOptionChange,
  StringOptions
} from '../options.ts'

type FieldProps = {
  onChange: (value: string) => void
  name: string
  value: string
  type?: string
}

const Field = ({ onChange, name, value, type = 'text' }: FieldProps) => {
  return e('input', {
    type,
    name,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      onChange(event.target.value)
  })
}

type TextFieldProps<K extends keyof StringOptions> = {
  name: K
  type?: string
}

export const TextField = <K extends keyof StringOptions>({
  name,
  type
}: TextFieldProps<K>) => {
  const { options, onChange } = useContext(OptionsContext)
  return e(Field, {
    onChange: string => onChange(name, string),
    name,
    value: String(options[name]),
    type
  })
}

type NumberFieldProps<K extends keyof NumberOptions> = {
  name: K
}

export const NumberField = <K extends keyof NumberOptions>({
  name
}: NumberFieldProps<K>) => {
  const { options, onChange } = useContext(OptionsContext)
  return e(Field, {
    onChange: string => onChange(name, +string),
    name,
    value: String(options[name]),
    type: 'number'
  })
}
