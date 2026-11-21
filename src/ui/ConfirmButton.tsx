// A button for actions that lose something (new game, removing a player
// mid-game). First tap arms it ("Tap again"), a second tap within 3 s
// does it. Waiting, or tapping elsewhere, cancels: no dialog, no typing.

import { useEffect, useState, type ReactNode } from 'react'

type ConfirmButtonProps = {
  className?: string
  onConfirm: () => void
  children: ReactNode
  /** What the button says while armed. */
  armedLabel?: ReactNode
  ariaLabel?: string
}

export function ConfirmButton({
  className = '',
  onConfirm,
  children,
  armedLabel = 'Tap again',
  ariaLabel,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false)

  // useEffect: run some code *after* drawing, here a 3-second timer that
  // disarms the button. The returned function cancels the timer if the
  // button disappears or is tapped again first.
  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(timer)
  }, [armed])

  return (
    <button
      type="button"
      className={`${className} ${armed ? 'armed' : ''}`}
      aria-label={ariaLabel}
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else {
          setArmed(true)
        }
      }}
    >
      {armed ? armedLabel : children}
    </button>
  )
}
