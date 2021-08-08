import { OptionsContext } from './contexts/options.ts'
import { htmlify } from './htmlify.ts'
import {
  createElement as e,
  Fragment,
  useState,
  MouseEvent,
  ReactNode
} from './lib/react.ts'
import {
  defaultOptions,
  ConversionOptions,
  OnOptionChange,
  stringKeys,
  booleanKeys,
  numberKeys,
  radioKeys,
  defaultRadioOptions,
  keys,
  listKeys
} from './options.ts'
import { download } from './utils.ts'
import { Log, LogMessage } from './components/Log.ts'
import { Options } from './components/Options.ts'
import { Offlineifier } from './components/Offlineifier.ts'
import { offlineify } from './offlineify.ts'
import { FootnotesContext } from './contexts/footnotes.ts'
import { FootnoteList } from './components/FootnoteList.ts'

declare global {
  interface Window {
    offline?: boolean
  }
}

export const App = () => {
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
      if (param !== null) options[key] = param === 'on'
    }
    for (const key of listKeys) {
      options[key] = params.getAll(key)
    }

    // Compatibility with old options
    if (params.get('wider') === 'off') {
      options.width = 480
      options.height = 360
    }
    if (!params.has('fps') && params.get('compatibility') === 'on') {
      options.fps = 60
    }
    const extensionUrl = params.get('extension-url')
    if (extensionUrl) {
      options.extensions.push(extensionUrl)
    }
    if (params.get('use-colour') === 'on') {
      options['monitor-value'] = 'colour'
    }
    if (params.get('no-limits') === 'on') {
      options.limits = false
      options.fencing = false
    }

    return options
  })

  const nonDefaultOptions = new URLSearchParams()
  for (const key of keys) {
    const value = options[key]
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          nonDefaultOptions.append(key, item)
        }
      }
    } else if (
      !(value instanceof File) &&
      value !== null &&
      value !== defaultOptions[key]
    ) {
      nonDefaultOptions.set(
        key,
        typeof value === 'boolean' ? (value ? 'on' : 'off') : String(value)
      )
    }
  }

  const handleOptionChange: OnOptionChange = (option, value) => {
    setOptions(options => ({
      ...options,
      [option]: value
    }))
  }

  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<LogMessage[]>([])

  const handleError = (error: unknown) => {
    setLog(log => [
      ...log,
      {
        message: `Unexpected error:\n${
          error instanceof Error ? error.stack ?? error.message : error
        }`,
        type: 'error'
      }
    ])
    console.error(error)
  }

  const handleHtmlify = () => {
    setLoading(true)
    setLog([])
    htmlify(options, (message, type) => {
      setLog(log => [...log, { message, type }])
    })
      .then(blob => {
        if (!blob) {
          setLog(log => [
            ...log,
            {
              message: "You didn't select a project file.",
              type: 'error'
            }
          ])
          return
        }
        if (options.autodownload) {
          download(blob)
          setLog(log => [
            ...log,
            {
              message:
                'I shall now try to download the file. If nothing happens, then click the "Download" button.',
              type: 'status'
            }
          ])
        }
        setLog(log => [
          ...log,
          {
            message: 'Done.',
            type: 'done',
            result: blob
          }
        ])
      })
      .catch(handleError)
      .finally(() => setLoading(false))
  }

  const handleOfflineify = () => {
    setLoading(true)
    setLog([])
    offlineify((message, type) => {
      setLog(log => [...log, { message, type }])
    })
      .then(blob => {
        download(blob, 'htmlifier-offline')
        setLog(log => [
          ...log,
          {
            message:
              'I have finished creating the offline version of the HTMLifier.',
            type: 'done',
            result: blob
          }
        ])
      })
      .catch(handleError)
      .finally(() => setLoading(false))
  }

  // To ensure that the footnote list renders synchronously, I need to mutate
  // `footnotes` directly
  const [footnotes] = useState<Map<string, ReactNode>>(new Map())

  return e(
    Fragment,
    null,
    e(Offlineifier, {
      offline: !!window.offline,
      onOfflineify: handleOfflineify,
      loading
    }),
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
      e(
        FootnotesContext.Provider,
        { value: { footnotes } },
        e(Options, { onHtmlify: handleHtmlify, loading })
      )
    ),
    e(Log, { log, fileName: options.title }),
    e(FootnoteList, { getFootnotes: () => [...footnotes] })
  )
}
