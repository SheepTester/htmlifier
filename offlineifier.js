window.offlineify = async ({ log = console.log } = {}) => {
  function toText (file) {
    return response => {
      if (response.ok) {
        return response.text()
      } else {
        log(
          `When I tried to download ${file}, I got an HTTP ${response.status} error.`,
          'error'
        )
        throw new Error(`HTTP error ${response.status} from ${file}`)
      }
    }
  }
  function problemFetching (file) {
    return err => {
      console.error(err)
      log(`I couldn't download ${file}. Are you offline?`, 'error')
      throw new Error(`Failed to fetch ${file}`)
    }
  }
  log('I shall download the required files for the HTMLifier.', 'status')
  const [html, bundle, downloader, css] = await Promise.all([
    fetch('./index.html')
      .catch(problemFetching('this web page'))
      .then(toText('this web page')),
    fetch('./src/main.bundle.min.js')
      .catch(
        problemFetching('the code that actually does the converting to HTML')
      )
      .then(toText('the code that actually does the converting to HTML'))
      .then(escapeScript),
    fetch('./download.js')
      .catch(problemFetching('the library that lets me download files'))
      .then(toText('the library that lets me download files'))
      .then(escapeScript),
    fetch('./main.css')
      .catch(problemFetching('the web page style'))
      .then(toText('the web page style'))
  ])
  const combined = html
    .replace('<body', `<body class="offline" data-offlineified="${new Date()}"`)
    // . wildcard in regex doesn't include newlines lol
    // https://stackoverflow.com/a/45981809
    .replace(/<!-- no-offline -->[^]*?<!-- \/no-offline -->/g, '')
    .replace(/\/\* no-offline \*\/[^]*?\/\* \/no-offline \*\//g, '')
    // Using functions to avoid $ substitution
    .replace(
      '<link rel="stylesheet" href="./main.css">',
      () => `<style>${css}</style>`
    )
    .replace(
      '<script src="./download.js" charset="utf-8"></script>',
      () => `<script>${downloader}</script>`
    )
    .replace(
      '<script src="./src/main.bundle.min.js" charset="utf-8"></script>',
      () => `<script>${bundle}</script>`
    )
  log(
    "I shall attempt to download the HTML file. If you don't see anything, then maybe your browser is preventing me from downloading files.",
    'status'
  )
  download(combined, 'htmlifier-offline.html', 'text/html')
  log("That's all!", 'done')
}
