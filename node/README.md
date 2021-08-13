# [HTMLifier](https://sheeptester.github.io/htmlifier/) for Node

Package a Scratch project inside an HTML file with no optimisations.

## Installation

```sh
$ npm install @sheeptester/htmlifier
```

## Example usage

The following example HTMLifies [Scratch 3.0 is
here!](https://scratch.mit.edu/projects/276660763/) and writes the result to a
file named `index.html`.

```js
import fs from 'fs/promises'
import Htmlifier from '@sheeptester/htmlifier'

async function main () {
  const html = await new Htmlifier()
    .htmlify({ type: 'id', id: '276660763' })
    .then(blob => blob.text())
  await fs.writeFile('./index.html', html)
}

main()
```

Because [`node-fetch`](https://www.npmjs.com/package/node-fetch) is strictly an
ES module, this package is also an ES module. If you're using a CommonJS module,
you can use [`esm`](https://www.npmjs.com/package/esm) to import this package.

```js
require = require('esm')(module)
const Htmlifier = require('@sheeptester/htmlifier')
```

The HTMLifier was primarily written for Deno and the web, so it uses
[`Blob`s](https://developer.mozilla.org/en-US/docs/Web/API/Blob) and
[`File`s](https://developer.mozilla.org/en-US/docs/Web/API/File) to pass binary
data around. You can use
[`fetch-blob`](https://www.npmjs.com/package/fetch-blob) to create `Blob`s and
`File`s for the HTMLifier.

```js
import Htmlifier from '@sheeptester/htmlifier'
import { fileFrom } from 'fetch-blob/from.js'

async function main () {
  const html = await new Htmlifier()
    .htmlify({ type: 'file', file: await fileFrom('./project.sb3') })
    .then(blob => blob.text())
  // ...
}

main()
```

## Documentation

[Auto-generated
documentation](https://doc.deno.land/https/github.com/SheepTester/htmlifier/raw/v1.0.2/src/htmlifier.ts)
is available courtesy of deno doc.
