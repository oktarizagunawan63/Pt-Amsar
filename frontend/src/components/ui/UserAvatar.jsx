import { useState } from 'react'
import clsx from 'clsx'

const initialsOf = (name) =>
  (name || 'U').split(' ').filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('')

/** Profile photo, falling back to initials when there is none or it fails to load. */
export default function UserAvatar({ user, className = 'h-8 w-8 text-xs' }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const url = user?.avatar_url

  if (url && url !== failedUrl) {
    return (
      <img
        src={url}
        alt={user?.name ? `Foto profil ${user.name}` : 'Foto profil'}
        onError={() => setFailedUrl(url)}
        className={clsx('shrink-0 rounded-full object-cover', className)}
      />
    )
  }

  return (
    <span className={clsx('flex shrink-0 items-center justify-center rounded-full bg-brand-600 font-semibold text-white', className)}>
      {initialsOf(user?.name)}
    </span>
  )
}
