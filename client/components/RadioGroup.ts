import { OptionsContext } from '../contexts/options.ts'
import {
  createElement as e,
  Fragment,
  ReactNode,
  useContext
} from '../lib/react.ts'
import { ConversionOptions, RadioOptions, radioValues } from '../options.ts'
import { label } from '../utils.ts'

type Props<K extends keyof RadioOptions> = {
  title: string
  labels: Record<RadioOptions[K], string | [ReactNode, ReactNode]>
}

// `name` needs to be a separate argument so that the type variable `K` can be
// resolved
const RadioGroup = <K extends keyof RadioOptions>(name: K) => ({
  title,
  labels
}: Props<K>) => {
  const { options, onChange } = useContext(OptionsContext)
  const checked = options[name]
  // I hate this
  const possibleValues = (radioValues[
    name
  ] as readonly string[]) as readonly RadioOptions[K][]
  return e(
    'fieldset',
    { className: 'radio-group' },
    e('legend', null, title),
    possibleValues.map(value =>
      e(
        OptionsContext.Provider,
        {
          key: value,
          value: {
            options,
            onChange: (optionName, optionValue) => {
              // Also select the radio if an inner input has changed
              onChange(name, value as ConversionOptions[K])
              onChange(optionName, optionValue)
            }
          }
        },
        e(
          'p',
          null,
          label(
            e('input', {
              type: 'radio',
              id: `${name}--${value}`,
              name,
              checked: value === checked,
              onChange: () => onChange(name, value as ConversionOptions[K])
            }),
            ' ',
            typeof labels[value] === 'string' ? labels[value] : labels[value][0]
          ),
          typeof labels[value] !== 'string' &&
            e(Fragment, null, ' ', labels[value][1])
        )
      )
    )
  )
}

export const RadioGroups = {
  'upload-mode': RadioGroup('upload-mode'),
  'loading-image': RadioGroup('loading-image'),
  stretch: RadioGroup('stretch'),
  cursor: RadioGroup('cursor'),
  'monitor-value': RadioGroup('monitor-value'),
  'cloud-provider': RadioGroup('cloud-provider')
}
