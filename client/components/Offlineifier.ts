import { createElement as e } from '../lib/react.ts'

type Props = {
  offline: boolean
  onOfflineify: () => void
  loading?: boolean
}

export const Offlineifier = ({ offline, onOfflineify, loading }: Props) => {
  return offline
    ? null
    : e(
        'p',
        null,
        e(
          'button',
          { onClick: onOfflineify, disabled: loading },
          'Download offline version'
        ),
        ' (An HTML file that can be opened and used in the browser without an internet connection)'
      )
}
