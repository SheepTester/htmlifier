// deno bundle --no-check --import-map import-map.json client/index.ts | terser > index.bundle.min.js

import { createElement as e } from './lib/react.ts'
import { render } from './lib/react-dom.ts'

const App = () => {
  return e('div', null, 'lol', 'ok')
}

render(e(App), document.getElementById('root'))
