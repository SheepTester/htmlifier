// deno bundle --no-check --import-map import-map.json client/index.ts | terser > index.bundle.min.js

import { createElement as e, StrictMode } from './lib/react.ts'
import { render } from './lib/react-dom.ts'
import { App } from './App.ts'

render(e(StrictMode, null, e(App)), document.getElementById('root'))
