// React glue for pressOrHold.ts: gives an element tap and hold behavior,
// plus `holding` for the filling progress bar. Also blocks the phone's own
// long-press menu (a known mobile pitfall).
//
// A "custom hook": a function starting with `use` that bundles React state
// and effects for reuse, here on cards and in the Built list.

import { useEffect, useRef, useState } from 'react'
import { HOLD_MS } from './holdToConfirm'
import {
  clickIsTap,
  nextPressPhase,
  type PressEvent,
  type PressPhase,
} from './pressOrHold'

export function usePressOrHold(onTap: (() => void) | null, onHold: () => void) {
  const [phase, setPhase] = useState<PressPhase>('idle')
  const send = (event: PressEvent) => setPhase((p) => nextPressPhase(p, event))

  // Keep the latest callbacks for the timer (see ConfirmButton).
  const holdRef = useRef(onHold)
  useEffect(() => {
    holdRef.current = onHold
  })

  useEffect(() => {
    if (phase === 'idle') return
    const ms = phase === 'holding' ? HOLD_MS : 500
    const timer = setTimeout(() => {
      if (phase === 'holding') {
        send('held')
        holdRef.current()
      } else {
        send('timeout')
      }
    }, ms)
    return () => clearTimeout(timer)
  }, [phase])

  return {
    holding: phase === 'holding',
    handlers: {
      onPointerDown: () => send('press'),
      onPointerUp: () => send('release'),
      onPointerLeave: () => send('release'),
      onPointerCancel: () => send('release'),
      onClick: () => {
        if (clickIsTap(phase)) onTap?.()
        send('click')
      },
      onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    },
  }
}
