// deno bundle --no-check --import-map import-map.json client/index.ts | terser > index.bundle.min.js

import { createElement as e } from './lib/react.ts'
import { render } from './lib/react-dom.ts'
import { Offlineifier } from './components/Offlineifier.ts'
import { OptionsManager } from './components/OptionsManager.ts'

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
    e(OptionsManager)
  )
}

render(e(App), document.getElementById('root'))
