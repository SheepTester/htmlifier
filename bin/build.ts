// deno run --allow-run --allow-read=src --allow-write=src build.ts [dev]

import { vm, extensionWorker, template } from '../src/dependencies.ts'
import { writeAll } from 'https://deno.land/std@0.101.0/io/util.ts'

const minify = Deno.args[0] !== 'dev'

const decoder = new TextDecoder()
const encoder = new TextEncoder()

const bundle = decoder.decode(
  await Deno.run({
    cmd: [
      'deno',
      'bundle',
      new URL('../src/main.js', import.meta.url).toString()
    ],
    stdout: 'piped'
  }).output()
)

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
  await writeAll(minifyProcess.stdin, encoder.encode())
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
  new URL('../src/main.bundle.min.js', import.meta.url),
  result
    .replace(/['"]__htmlifier_TEMP__['"]/, () => JSON.stringify(template))
    .replace(/['"]__htmlifier_EW__['"]/, () => JSON.stringify(extensionWorker))
    .replace(/['"]__htmlifier_VM__['"]/, () => JSON.stringify(vm))
)
