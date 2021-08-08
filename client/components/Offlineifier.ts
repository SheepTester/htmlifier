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
        'button',
        {
          onClick: onOfflineify,
          disabled: loading,
          title:
            'Downloads an HTML file that can be opened and used in the browser without an internet connection.'
        },
        'Download offline version'
      )
}
