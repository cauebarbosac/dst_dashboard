// React side of the screen wake lock (M10): keeps the screen awake while
// `wanted` is true and the app is on screen. Returns whether this browser
// supports it at all (to explain a toggle that can't work).

import { useEffect } from 'react'
import { browserWakeLockEnv, createKeepAwake } from '../pwa/wakeLock'

const supported = browserWakeLockEnv().request !== null

export function useKeepAwake(wanted: boolean): boolean {
  // A fresh controller each time it's switched on; the cleanup (returned
  // function) lets go of the lock when it's switched off or the app closes.
  useEffect(() => {
    if (!wanted) return
    const keepAwake = createKeepAwake(browserWakeLockEnv())
    keepAwake.setWanted(true)
    return () => keepAwake.dispose()
  }, [wanted])
  return supported
}
