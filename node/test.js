// This should not throw an error

import Htmlifier from './index.min.js'
import fetch from 'node-fetch'

function checkForReasonableHtml (html) {
  if (html.length < 1_000_000) {
    throw new RangeError(
      `Shouldn't the result be at least a megabyte instead of ${html.length} characters?`
    )
  }
  if (!html.startsWith('<!DOCTYPE html>')) {
    throw new SyntaxError(
      `HTML does not start with DOCTYPE. Instead, it starts with ${html.slice(
        0,
        20
      )}...`
    )
  }
}

new Htmlifier()
  .htmlify({ type: 'id', id: '276660763' })
  .then(blob => blob.text())
  .then(checkForReasonableHtml)

fetch('https://sheeptester.gitlab.io/test/special_cloud_behaviours_example.sb3')
  .then(r => r.blob())
  .then(blob => new Htmlifier().htmlify({ type: 'file', file: blob }))
  .then(blob => blob.text())
  .then(checkForReasonableHtml)

new Htmlifier()
  .htmlify({
    type: 'url',
    url:
      'https://sheeptester.gitlab.io/test/special_cloud_behaviours_example.sb3'
  })
  .then(blob => blob.text())
  .then(checkForReasonableHtml)
