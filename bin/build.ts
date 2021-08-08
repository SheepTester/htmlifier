// deno run --allow-run --allow-read=src --allow-write=src build.ts [dev]

import { vm, extensionWorker, template } from '../src/dependencies.ts'
import { writeAll } from 'https://deno.land/std@0.101.0/io/util.ts'

const minify = Deno.args[0] !== 'dev'

const decoder = new TextDecoder()
const encoder = new TextEncoder()

const bundleProcess = Deno.run({
  cmd: [
    'deno',
    'bundle',
    '--no-check',
    '--import-map',
    new URL('../import-map.json', import.meta.url).toString(),
    new URL('../client/index.ts', import.meta.url).toString()
  ],
  stdout: 'piped'
})
const bundle = decoder.decode(await bundleProcess.output())
const status = await bundleProcess.status()
if (!status.success) {
  throw new Error(
    `\`deno bundle\` exited with code ${status.code}, signal ${status.signal}`
  )
}

let result = `(async () => {
  const dependencies_vm = '__htmlifier_VM__'
  const dependencies_extensionWorker = '__htmlifier_EW__'
  const dependencies_template = '__htmlifier_TEMP__'
  ${bundle}
})()`

if (minify) {
  console.log('Minifying...')
  const minifyProcess = Deno.run({
    cmd: ['terser', '--compress', 'unsafe'],
    stdin: 'piped',
    stdout: 'piped'
  })
  await writeAll(minifyProcess.stdin, encoder.encode(result))
  minifyProcess.stdin.close()
  result = decoder.decode(await minifyProcess.output())
  const status = await minifyProcess.status()
  if (!status.success) {
    throw new Error(
      `Terser exited with code ${status.code}, signal ${status.signal}`
    )
  }
}

console.log('Substituting dependencies...')
Deno.writeTextFile(
  new URL('../index.bundle.min.js', import.meta.url),
  result
    .replace(/['"]__htmlifier_TEMP__['"]/, () => JSON.stringify(template))
    .replace(/['"]__htmlifier_EW__['"]/, () => JSON.stringify(extensionWorker))
    .replace(/['"]__htmlifier_VM__['"]/, () => JSON.stringify(vm))
)
