// Keep the screen awake while the app is open (M10).
//
// Browsers offer a "screen wake lock": while the page holds one, the phone
// doesn't dim or lock. The browser drops it by itself whenever the app goes
// to the background, so it has to be asked for again when the app comes
// back. This controller does that bookkeeping. The browser parts are passed
// in (`WakeLockEnv`), so tests can use fakes.

/** What the browser hands back for a granted lock (WakeLockSentinel). */
export type WakeLockHandle = {
  release(): Promise<void>
  addEventListener(type: 'release', listener: () => void): void
}

export type WakeLockEnv = {
  /** Ask for a lock; null when this browser has no wake lock at all. */
  request: (() => Promise<WakeLockHandle>) | null
  isVisible(): boolean
  /** Call `listener` whenever the app is shown or hidden; returns "unsubscribe". */
  onVisibilityChange(listener: () => void): () => void
}

export type KeepAwake = {
  supported: boolean
  setWanted(wanted: boolean): void
  /** True while the screen is actually being kept awake. */
  isHeld(): boolean
  dispose(): void
}

export function createKeepAwake(env: WakeLockEnv): KeepAwake {
  let wanted = false
  let held: WakeLockHandle | null = null
  let asking = false

  function sync(): void {
    if (!env.request) return
    if (wanted && env.isVisible() && !held && !asking) {
      asking = true
      env.request().then(
        (lock) => {
          asking = false
          if (!wanted) {
            // turned off while the browser was answering
            void lock.release().catch(() => {})
            return
          }
          held = lock
          // the browser drops it when the app is hidden: forget it, and
          // ask again when the app is visible (see onVisibilityChange)
          lock.addEventListener('release', () => {
            if (held === lock) held = null
          })
        },
        () => {
          // refused (battery saver, app hidden meanwhile…): not an error,
          // the next time the app is shown it tries again
          asking = false
        },
      )
    } else if (!wanted && held) {
      const lock = held
      held = null
      void lock.release().catch(() => {})
    }
  }

  const unsubscribe = env.onVisibilityChange(sync)

  return {
    supported: env.request !== null,
    setWanted(next) {
      wanted = next
      sync()
    },
    isHeld: () => held !== null,
    dispose() {
      unsubscribe()
      wanted = false
      sync()
    },
  }
}

/** The real browser, or a "not supported" stand-in where there is none. */
export function browserWakeLockEnv(): WakeLockEnv {
  const hasDocument = typeof document !== 'undefined'
  const wakeLock =
    typeof navigator !== 'undefined' && 'wakeLock' in navigator
      ? navigator.wakeLock
      : null
  return {
    request: wakeLock ? () => wakeLock.request('screen') : null,
    isVisible: () => hasDocument && document.visibilityState === 'visible',
    onVisibilityChange(listener) {
      if (!hasDocument) return () => {}
      document.addEventListener('visibilitychange', listener)
      return () => document.removeEventListener('visibilitychange', listener)
    },
  }
}
