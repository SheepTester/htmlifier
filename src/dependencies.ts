// Importing static files

import { toText } from './ensure-ok.ts'

declare const dependencies_vm: string | undefined
declare const dependencies_extensionWorker: string | undefined
declare const dependencies_template: string | undefined

export const VM_URL = 'https://sheeptester.github.io/scratch-vm/16-9/vm.min.js'

export const vm =
  typeof dependencies_vm !== 'undefined'
    ? dependencies_vm
    : await fetch(VM_URL).then(toText)

export const EXTENSION_WORKER_URL =
  'https://sheeptester.github.io/scratch-vm/16-9/extension-worker.js'

export const extensionWorker =
  typeof dependencies_extensionWorker !== 'undefined'
    ? dependencies_extensionWorker
    : await fetch(EXTENSION_WORKER_URL).then(toText)

async function getTemplateHtml (
  provider: (extension: string) => Promise<string>
): Promise<string> {
  const html = await provider('html')
  const css = await provider('css')
  const js = await provider('js')
  return html
    .replace('{CSS}', () => `<style>\n${css}\n</style>`)
    .replace('{JS}', () => `<script>\n${js}\n</script>`)
}

export const template =
  typeof dependencies_template !== 'undefined'
    ? dependencies_template
    : typeof Deno !== 'undefined'
    ? await getTemplateHtml(extension =>
        Deno.readTextFile(
          new URL(`./template/template.${extension}`, import.meta.url)
        )
      )
    : await getTemplateHtml(extension =>
        fetch(
          new URL(`./template/template.${extension}`, import.meta.url)
        ).then(toText)
      )
