// Importing static files

declare const dependencies_vm: string | undefined
declare const dependencies_extensionWorker: string | undefined
declare const dependencies_template: string | undefined

export const VM_URL = 'https://sheeptester.github.io/scratch-vm/16-9/vm.min.js'

export const vm =
  typeof dependencies_vm !== 'undefined'
    ? dependencies_vm
    : await fetch(VM_URL).then(r => r.text())

export const EXTENSION_WORKER_URL =
  'https://sheeptester.github.io/scratch-vm/16-9/extension-worker.js'

export const extensionWorker =
  typeof dependencies_extensionWorker !== 'undefined'
    ? dependencies_extensionWorker
    : await fetch(EXTENSION_WORKER_URL).then(r => r.text())

export const template =
  typeof dependencies_template !== 'undefined'
    ? dependencies_template
    : typeof Deno !== 'undefined'
    ? await Deno.readTextFile(
        new URL('./template/template.html', import.meta.url)
      )
    : await fetch(new URL('./template/template.html', import.meta.url)).then(
        r => r.text()
      )
