// The small "offline" indicator (M11). Taps still work offline: they show
// on this phone right away and are sent when the connection is back.
// Only shown after a couple of seconds offline, so a normal start-up (or a
// short hiccup) doesn't flash it.

import { useEffect, useState } from 'react'

export type Connection = { online: boolean; waiting: number }

const SHOW_AFTER_MS = 2000

export function ConnectionStrip({ online, waiting }: Connection) {
  const [offlineAWhile, setOfflineAWhile] = useState(false)
  useEffect(() => {
    if (online) return
    const timer = setTimeout(() => setOfflineAWhile(true), SHOW_AFTER_MS)
    // Back online (or gone): cancel, and start over next time.
    return () => {
      clearTimeout(timer)
      setOfflineAWhile(false)
    }
  }, [online])

  if (online || !offlineAWhile) return null
  return (
    <div className="connection-strip" role="status">
      📴 Offline
      {waiting > 0 && (
        <span>
          {' '}
          · {waiting} {waiting === 1 ? 'tap' : 'taps'} to send
        </span>
      )}
    </div>
  )
}
