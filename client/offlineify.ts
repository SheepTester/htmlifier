import { escapeScript } from '../src/escape.ts'
import { Logger } from '../src/htmlifier.ts'

export async function offlineify (log: Logger): Promise<Blob> {
  function toText (file: string) {
    return (response: Response) => {
      if (response.ok) {
        return response.text()
      } else {
        throw new Error(
          `When I tried to download ${file}, I got an HTTP ${response.status} error.`
        )
      }
    }
  }
  function problemFetching (file: string) {
    return (err: unknown) => {
      console.error(err)
      throw new Error(`I couldn't download ${file}. Are you offline?`)
    }
  }
  log('I shall download the required files for the HTMLifier.', 'status')
  const [html, css, js] = await Promise.all([
    fetch('./index.html')
      .catch(problemFetching('this web page'))
      .then(toText('this web page')),
    fetch('./main.css')
      .catch(problemFetching('the web page style'))
      .then(toText('the web page style')),
    fetch('./index.bundle.min.js')
      .catch(
        problemFetching('the code that actually does the converting to HTML')
      )
      .then(toText('the code that actually does the converting to HTML'))
      .then(escapeScript)
  ])
  const combined = html
    .replace('<body', `<body class="offline" data-offlineified="${new Date()}"`)
    // . wildcard in regex doesn't include newlines lol
    // https://stackoverflow.com/a/45981809
    .replace(/<!-- no-offline -->[^]*?<!-- \/no-offline -->/g, '')
    .replace(/\/\* no-offline \*\/[^]*?\/\* \/no-offline \*\//g, '')
    // Using functions to avoid $ substitution
    .replace(
      '<link rel="stylesheet" href="./main.css" />',
      () => `<style>\n${css}\n</style>`
    )
    .replace(
      '<script src="./index.bundle.min.js" charset="utf-8"></script>',
      () => `<script>\nwindow.offline = true\n;${js}\n</script>`
    )
  log(
    "I shall attempt to download the HTML file. If you don't see anything, then maybe your browser is preventing me from downloading files.",
    'status'
  )
  return new Blob([combined], { type: 'text/html' })
}
