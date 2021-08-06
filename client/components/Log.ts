import { createElement as e } from '../lib/react.ts'
import { download } from '../utils.ts'

type DownloadBtnProps = {
  blob: Blob
  name?: string
}

const DownloadBtn = ({ blob, name }: DownloadBtnProps) => {
  const handleClick = () => {
    download(blob, name)
  }
  return e('button', { onClick: handleClick }, 'Download')
}

type PreviewBtnProps = {
  blob: Blob
}

const PreviewBtn = ({ blob }: PreviewBtnProps) => {
  const handleClick = async () => {
    const newTab = window.open('', '_blank')
    if (!newTab) {
      throw new Error('window.open returned null')
    }
    newTab.document.write(
      '<style>html, body { height: 100%; margin: 0; }</style><body></body>'
    )
    const frame = document.createElement('iframe')
    frame.style.cssText = 'width: 100%; height: 100%; border: none;'
    frame.srcdoc = await blob.text()
    frame.addEventListener('load', () => {
      if (frame.contentDocument) {
        newTab.document.title = frame.contentDocument.title
      }
    })
    newTab.document.body.appendChild(frame)
  }

  return e('button', { onClick: handleClick }, 'Open preview')
}

export type LogMessage =
  | {
      message: string
      type: 'status' | 'progress' | 'error'
    }
  | {
      message: string
      type: 'done'
      result: Blob
    }

type LogProps = {
  log: LogMessage[]
  fileName?: string
}

export const Log = ({ log, fileName }: LogProps) => {
  return e(
    'ul',
    { class: 'log' },
    log.map((message, i) =>
      e(
        'li',
        { key: i, className: `log-entry log-${message.type}` },
        message.message,
        message.type === 'done' && [
          ' ',
          e(DownloadBtn, { blob: message.result, name: fileName }),
          ' ',
          e(PreviewBtn, { blob: message.result })
        ]
      )
    )
  )
}
