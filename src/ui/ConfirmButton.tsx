// A button for actions that lose data (new game, removing a player).
// First tap arms it; then press and HOLD until the bar fills (HOLD_MS).
// Lifting early, sliding off, or waiting too long cancels. No dialogs,
// no typing. The steps themselves live in holdToConfirm.ts (tested).

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  ARMED_MS,
  HOLD_MS,
  nextHoldPhase,
  type HoldEvent,
  type HoldPhase,
} from './holdToConfirm'

type ConfirmButtonProps = {
  className?: string
  onConfirm: () => void
  children: ReactNode
  /** What the button says once armed, e.g. "Hold to remove". */
  armedLabel?: ReactNode
  ariaLabel?: string
}

export function ConfirmButton({
  className = '',
  onConfirm,
  children,
  armedLabel = 'Hold to confirm',
  ariaLabel,
}: ConfirmButtonProps) {
  const [phase, setPhase] = useState<HoldPhase>('idle')
  // useRef: a box React keeps between redraws without redrawing when it
  // changes. Holds the latest onConfirm for the timer below.
  const confirmRef = useRef(onConfirm)
  useEffect(() => {
    confirmRef.current = onConfirm
  })

  const send = (event: HoldEvent) => setPhase((p) => nextHoldPhase(p, event))

  // Timers per phase: armed waits for the hold, holding counts the hold,
  // confirmed clears itself if no click follows.
  useEffect(() => {
    if (phase === 'idle') return
    const ms =
      phase === 'armed' ? ARMED_MS : phase === 'holding' ? HOLD_MS : 500
    const event: HoldEvent = phase === 'holding' ? 'held' : 'timeout'
    const timer = setTimeout(() => {
      send(event)
      if (event === 'held') confirmRef.current()
    }, ms)
    return () => clearTimeout(timer)
  }, [phase])

  const armed = phase === 'armed' || phase === 'holding'
  return (
    <button
      type="button"
      className={`hold-button ${className} ${armed ? 'armed' : ''} ${phase === 'holding' ? 'holding' : ''}`}
      style={{ '--hold-ms': `${HOLD_MS}ms` } as CSSProperties}
      aria-label={ariaLabel}
      onClick={() => send('tap')}
      onPointerDown={() => send('press')}
      onPointerUp={() => send('release')}
      onPointerLeave={() => send('release')}
      onPointerCancel={() => send('release')}
      // Stop the phone's own long-press menu from popping up while holding.
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="hold-label">{armed ? armedLabel : children}</span>
    </button>
  )
}
