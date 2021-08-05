import { OptionsContext } from '../contexts/options.ts'
import {
  createElement as e,
  Fragment,
  useState,
  MouseEvent
} from '../lib/react.ts'
import {
  defaultOptions,
  ConversionOptions,
  OnOptionChange,
  stringKeys,
  booleanKeys,
  numberKeys,
  radioKeys,
  defaultRadioOptions,
  keys
} from '../options.ts'
import { link } from '../utils.ts'
import { NumberField, TextField } from './Field.ts'
import { Fieldset } from './Fieldset.ts'
import { RadioGroups } from './RadioGroup.ts'
import { label } from '../utils.ts'

export const Options = () => {
  const [options, setOptions] = useState<ConversionOptions>(() => {
    const params = new URL(window.location.href).searchParams
    // TypeScript is annoying sometimes
    const radioOptions = { ...defaultRadioOptions }
    const radioOptionsRecord = radioOptions as Record<string, string>
    for (const key of radioKeys) {
      const param = params.get(key)
      if (param !== null) radioOptionsRecord[key] = param
    }
    const options = { ...defaultOptions, ...radioOptions }
    for (const key of stringKeys) {
      const param = params.get(key)
      if (param !== null) options[key] = param
    }
    for (const key of numberKeys) {
      const param = params.get(key)
      if (param !== null) options[key] = +param
    }
    for (const key of booleanKeys) {
      const param = params.get(key)
      if (param !== null) options[key] = param === 'true' || param === 'on'
    }
    return options
  })

  const nonDefaultOptions = new URLSearchParams()
  for (const key of keys) {
    const value = options[key]
    if (
      !(value instanceof File) &&
      value !== null &&
      value !== defaultOptions[key]
    ) {
      nonDefaultOptions.set(key, String(value))
    }
  }

  const handleOptionChange: OnOptionChange = (option, value) => {
    setOptions({
      ...options,
      [option]: value
    })
  }

  return e(
    Fragment,
    null,
    e(
      'p',
      null,
      e('a', { href: `?${nonDefaultOptions}` }, 'Save options in link'),
      ' · ',
      e(
        'a',
        {
          className: 'bookmarklet-link',
          title:
            'Drag this link into your bookmarks bar and click it while on a project page to HTMLify the project.',
          onClick: (event: MouseEvent) => {
            alert(
              'Drag this link into your bookmarks bar and click it while on a project page to HTMLify the project.'
            )
            event.preventDefault()
          },
          href: String.raw`javascript:(match=>open(${JSON.stringify(
            `https://sheeptester.github.io/htmlifier/?${nonDefaultOptions}`
          )}+match[1]+'#htmlify'))(location.href.match(/scratch\.mit\.edu\/projects\/(\d+)/)||prompt('Please paste the Scratch project URL or ID to HTMLify:').match(/(\d+)/))`
        },
        'HTMLify'
      )
    ),
    e(
      OptionsContext.Provider,
      { value: { options, onChange: handleOptionChange } },
      e(RadioGroups['upload-mode'], {
        title: 'Select project by',
        labels: {
          id: [
            ['ID on the ', link('https://scratch.mit.edu/', 'Scratch website')],
            label(
              'Project ID: ',
              e(NumberField, { name: 'id', placeholder: '104' })
            )
          ],
          file: ['Uploaded file', ['Upload project file: ', 'wow']],
          url: [
            'Project file hosted online',
            label(
              'URL: ',
              e(TextField, {
                name: 'project-url',
                placeholder: 'https://example.com/project.sb3'
              })
            )
          ]
        }
      }),
      e(
        Fieldset,
        { title: 'Options' },
        e(Fieldset, { title: 'Mouse pointers' }),
        e(Fieldset, { title: 'Monitor style' }),
        e(Fieldset, { title: 'Cloud variable source' }),
        e(Fieldset, {
          title: [
            link('https://sheeptester.github.io/scratch-gui/', 'E羊icques'),
            ' (modded) options'
          ]
        })
      )
    )
  )
}
