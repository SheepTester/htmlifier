import { createElement as e } from '../lib/react.ts'

type Props = {
  offline: boolean
}

export const Offlineifier = ({ offline }: Props) => {
  const handleOffline = () => {
    // TODO
  }

  return offline
    ? null
    : e(
        'p',
        null,
        e('button', { onClick: handleOffline }, 'Download offline version'),
        ' (An HTML file that can be opened and used in the browser without an internet connection)'
      )
}
