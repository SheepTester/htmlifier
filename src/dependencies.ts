// Importing static files

declare const dependencies:
  | {
      vm: string
      extensionWorker: string
      template: string
    }
  | undefined

export const VM_URL = 'https://sheeptester.github.io/scratch-vm/16-9/vm.min.js'

export const vm =
  typeof dependencies !== 'undefined'
    ? dependencies.vm
    : await fetch(VM_URL).then(r => r.text())

export const EXTENSION_WORKER_URL =
  'https://sheeptester.github.io/scratch-vm/16-9/extension-worker.js'

export const extensionWorker =
  typeof dependencies !== 'undefined'
    ? dependencies.extensionWorker
    : await fetch(EXTENSION_WORKER_URL).then(r => r.text())

export const template =
  typeof dependencies !== 'undefined'
    ? dependencies.template
    : typeof Deno !== 'undefined'
    ? await Deno.readTextFile(
        new URL('./template/template.html', import.meta.url)
      )
    : await fetch(new URL('./template/template.html', import.meta.url)).then(
        r => r.text()
      )
