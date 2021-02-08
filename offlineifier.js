function offlineify ({
  log = console.log
} = {}) {
  function toDataURI (response) {
    return response.blob().then(blob => new Promise(resolve => {
      const reader = new FileReader()
      reader.addEventListener('load', e => {
        resolve(reader.result)
      }, { once: true })
      reader.readAsDataURL(blob)
    }))
  }
  function toText (file) {
    return response => {
      if (response.ok) {
        return response.text()
      } else {
        log(`Fetching ${file} gave a ${response.status} error`, 'error')
        throw new Error('error logged')
      }
    }
  }
  function problemFetching (file) {
    return err => {
      console.error(err);
      log(`There was a problem fetching ${file} from the internet`, 'error')
      throw new Error('error logged')
    }
  }
  function removeScriptTag (js) {
    return js.replace(/<\/script>/g, '')
  }
  log('Getting all required files...', 'status')
  return Promise.all([
    fetch('./index.html').catch(problemFetching('this web page')).then(toText('this web page')),
    fetch('https://sheeptester.github.io/scratch-vm/16-9/vm.min.js')
      .catch(problemFetching('the Scratch engine'))
      .then(toText('the Scratch engine'))
      .then(async vmCode => {
        // TODO: ??? What happened here, with `extensionWorkerGet` being
        // undefined and `extensionWorker` being unused?
        let extensionWorker
        const extensionWorkerMatch = vmCode.match(extensionWorkerGet)
        if (!extensionWorkerMatch) throw new Error('Cannot find extension-worker.js')
        const workerCode = await fetch('https://sheeptester.github.io/scratch-vm/16-9/' + extensionWorkerMatch[1])
          .catch(problemFetching('the extension worker'))
          .then(toText('the extension worker'))
        return [vmCode, workerCode].map(removeScriptTag)
      }),
    fetch('./hacky-file-getter.js').catch(problemFetching('the HTMLifying script')).then(toText('the HTMLifying script')).then(removeScriptTag),
    fetch('./download.js').catch(problemFetching('the downloader')).then(toText('the downloader')).then(removeScriptTag),
    fetch('./jszip.min.js').catch(problemFetching('JSZip')).then(toText('JSZip')).then(removeScriptTag),
    fetch('./template.html').catch(problemFetching('the HTML template')).then(toDataURI),
    fetch('./main.css').catch(problemFetching('the CSS')).then(toText('the CSS'))
  ]).then(([
    html,
    [vm, extensionWorker],
    hackyFileGetter,
    downloader,
    jszip,
    template,
    css
  ]) => {
    html = html
      .replace('<body', `<body class="offline" data-offlineified="${new Date()}"`)
      // Using functions to avoid $ substitution
      .replace('<script src="./hacky-file-getter.js" charset="utf-8"></script>', () => `<script>${hackyFileGetter}</script>`)
      .replace('<script src="./jszip.min.js" charset="utf-8"></script>', () => `<script>${jszip}</script>`)
      .replace('<script src="./download.js" charset="utf-8"></script>', () => `<script>${downloader}</script>`)
      // . wildcard in regex doesn't include newlines lol
      // https://stackoverflow.com/a/45981809
      .replace(/<!-- no-offline -->[^]*?<!-- \/no-offline -->/g, '')
      .replace(/\/\* no-offline \*\/[^]*?\/\* \/no-offline \*\//g, '')
      .replace('// [offline-vm-src]', `Promise.resolve(document.getElementById('vm-src').innerHTML)`)
      .replace('// [offline-extension-worker-src]', `const workerCode = document.getElementById('worker-src').innerHTML`)
      .replace('<link rel="stylesheet" href="./main.css">', () => `<style>${css}</style>`)
      .replace('// [template]', () => JSON.stringify(template))
      // Do this last because it phat
      // javascript/worker: https://www.html5rocks.com/en/tutorials/workers/basics/
      .replace('<script src="https://sheeptester.github.io/scratch-vm/16-9/vm.min.js" charset="utf-8"></script>', () => `<script id="vm-src">${vm}</script><script id="worker-src" type="javascript/worker">${extensionWorker}</script>`)
    log('Attempting to download HTML file...', 'status')
    download(html, 'htmlifier-offline.html', 'text/html')
    log('All good!', 'done')
  })
}
