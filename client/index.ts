// deno bundle --no-check --import-map import-map.json client/index.ts | terser > index.bundle.min.js

import { createElement as e, ReactNode } from './lib/react.ts'
import { render } from './lib/react-dom.ts'
import { Offlineifier } from './components/Offlineifier.ts'
import { Options } from './components/Options.ts'

declare global {
  interface Window {
    offline?: boolean
  }
}

const App = () => {
  return e(
    'div',
    null,
    e(Offlineifier, { offline: !!window.offline }),
    e(Options)
  )
}

render(e(App), document.getElementById('root'))
