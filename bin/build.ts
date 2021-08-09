// deno run --allow-run --allow-read=src --allow-write=src build.ts [dev]

import { vm, extensionWorker, template } from '../src/dependencies.ts'
import { writeAll } from 'https://deno.land/std@0.101.0/io/util.ts'

const minify = !Deno.args.includes('dev')
const isNode = Deno.args.includes('node')

const decoder = new TextDecoder()
const encoder = new TextEncoder()

const bundleProcess = Deno.run({
  cmd: [
    'deno',
    'bundle',
    '--no-check',
    '--import-map',
    new URL('../import-map.json', import.meta.url).toString(),
    new URL(
      isNode ? '../src/htmlifier.ts' : '../client/index.ts',
      import.meta.url
    ).toString()
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

let result = isNode
  ? `import fetch from 'node-fetch'
import Blob from 'fetch-blob'

// A lame "polyfill" for FileReader
class FileReader {
  addEventListener (_, callback) {
    this.callback = callback
  }

  async readAsDataURL (blob) {
    // https://stackoverflow.com/a/62684503
    this.result = Buffer.from(await blob.arrayBuffer()).toString('base64')
    this.callback()
  }
}

const dependencies_vm = '__htmlifier_VM__'
const dependencies_extensionWorker = '__htmlifier_EW__'
const dependencies_template = '__htmlifier_TEMP__'

${bundle.replace(
  /(dependencies_\w+)\s*:[^;]+;/g,
  (_, match) => `${match} : undefined;`
)}`
  : `;(async () => {
  const dependencies_vm = '__htmlifier_VM__'
  const dependencies_extensionWorker = '__htmlifier_EW__'
  const dependencies_template = '__htmlifier_TEMP__'
  ${bundle}
})()`

if (minify) {
  console.log('Minifying...')
  const options = ['terser', '--compress', 'unsafe']
  if (isNode) {
    options.push('--module')
  }
  const minifyProcess = Deno.run({
    cmd: options,
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
  new URL(
    isNode ? '../node/index.min.js' : '../index.bundle.min.js',
    import.meta.url
  ),
  result
    .replace(/['"]__htmlifier_TEMP__['"]/, () => JSON.stringify(template))
    .replace(/['"]__htmlifier_EW__['"]/, () => JSON.stringify(extensionWorker))
    .replace(/['"]__htmlifier_VM__['"]/, () => JSON.stringify(vm))
)
