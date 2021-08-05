import {
  createElement as e,
  Fragment,
  useState,
  MouseEvent
} from '../lib/react.ts'
import { link } from '../utils.ts'
import { NumberField, TextField } from './Field.ts'
import { Fieldset } from './Fieldset.ts'
import { RadioGroup } from './RadioGroup.ts'

type Colour = string
type Url = string

export type ConversionOptions = {
  'upload-mode': 'id' | 'file' | 'url'
  id: number
  file: File | null
  'project-url': Url
  // TODO
  // 'include-file': boolean

  // # Options
  title: string
  username: string
  compatibility: boolean
  turbo: boolean
  'favicon-file': File | null
  'background-file': File | null
  progress: boolean
  'progress-colour': Colour
  'loading-image': 'file' | 'url'
  'loading-image-file': File | null
  'loading-image-url': Url
  autostart: boolean
  fullscreen: boolean
  'start-stop-controls': boolean
  stretch: 'stage' | 'loading-image' | 'none'
  zip: boolean

  // ## Mouse pointers
  cursor: 'default' | 'none' | 'file'
  'cursor-file': File | null
  'pointer-lock': boolean

  // ## Monitor style
  'use-colour': boolean
  'monitor-colour': Colour
  'transparent-monitor': boolean
  'monitor-text': Colour

  // ## Cloud variable source
  localstorage: 'localstorage' | 'ws'
  'cloud-ws': Url
  'special-cloud': boolean

  // ## E羊icques (modded) options
  wider: boolean
  width: number
  height: number
  'extension-url': Url
  'no-limits': boolean

  autodownload: boolean
}

const defaultOptions: ConversionOptions = {
  'upload-mode': 'id',
  id: 276660763,
  file: null,
  'project-url': '',

  title: 'Scratch 3.0 is here!',
  username: 'ScratchCat',
  compatibility: true,
  turbo: false,
  'favicon-file': null,
  'background-file': null,
  progress: true,
  'progress-colour': '#00ffff',
  'loading-image': 'file',
  'loading-image-file': null,
  'loading-image-url': '',
  autostart: true,
  fullscreen: true,
  'start-stop-controls': false,
  stretch: 'none',
  zip: false,

  cursor: 'default',
  'cursor-file': null,
  'pointer-lock': false,

  'use-colour': false,
  'monitor-colour': '#ff8c1a',
  'monitor-text': '#ffffff',
  'transparent-monitor': false,

  localstorage: 'localstorage',
  'cloud-ws': '',
  'special-cloud': false,

  wider: false,
  width: 480,
  height: 360,
  'extension-url': '',
  'no-limits': false,

  autodownload: true
}

const keys = Object.keys(defaultOptions) as (keyof ConversionOptions)[]

type ConversionOptionsAsRecord = {
  [key in keyof ConversionOptions]: string | number | boolean | File | null
}

export const Options = () => {
  const [options, setOptions] = useState<ConversionOptions>(() => {
    const options = { ...defaultOptions }
    const params = new URL(window.location.href).searchParams
    const recordOptions = options as ConversionOptionsAsRecord
    for (const key of keys) {
      const param = params.get(key)
      if (param === null) {
        continue
      }
      // Annoyingly, I can't do `options[key] = +param` etc.
      if (typeof options[key] === 'number') {
        recordOptions[key] = +param
      } else if (typeof options[key] === 'string') {
        recordOptions[key] = param
      } else if (typeof options[key] === 'boolean') {
        recordOptions[key] = param === 'true' || param === 'on'
      }
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

  const handleOptionChange = <K extends keyof ConversionOptions>(
    option: K,
    value: ConversionOptions[K]
  ) => {
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
    e(RadioGroup, {
      label: 'Project source',
      name: 'upload-mode',
      onChange: value =>
        handleOptionChange('upload-mode', value as 'id' | 'file' | 'url'),
      options: {
        id: [
          'Project ID: ',
          e(NumberField, {
            name: 'id',
            value: options.id,
            onChange: value => handleOptionChange('id', value)
          })
        ],
        file: ['Upload project file: '],
        url: [
          'Project file from URL: ',
          e(TextField, {
            name: 'project-url',
            value: options['project-url'],
            onChange: value => handleOptionChange('project-url', value)
          })
        ]
      },
      checked: options['upload-mode']
    }),
    e(
      Fieldset,
      { label: 'Options' },
      e(Fieldset, { label: 'Mouse pointers' }),
      e(Fieldset, { label: 'Monitor style' }),
      e(Fieldset, { label: 'Cloud variable source' }),
      e(Fieldset, {
        label: [
          link('https://sheeptester.github.io/scratch-gui/', 'E羊icques'),
          ' (modded) options'
        ]
      })
    )
  )
}
