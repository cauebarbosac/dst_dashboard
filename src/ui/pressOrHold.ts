// One element, two meanings (M7): a TAP does one thing (claim the builder
// role), a HOLD of HOLD_MS does another (mark built). Kept pure so it can be
// tested without a browser.
//
//   idle ──press──▶ holding ──(held HOLD_MS)──▶ fired ──click/timeout──▶ idle
//     ▲                │
//     └────release─────┘   (lifted early: it was a tap; the click follows)
//
// `fired` swallows the click the browser sends when the finger lifts after
// a completed hold, so a hold never also counts as a tap.

export type PressPhase = 'idle' | 'holding' | 'fired'

export type PressEvent =
  | 'press' // finger down
  | 'release' // finger up early, slid off, or the browser started scrolling
  | 'held' // finger stayed down for HOLD_MS
  | 'click' // the browser's click (finger down + up)
  | 'timeout' // fired, and no click came

export function nextPressPhase(
  phase: PressPhase,
  event: PressEvent,
): PressPhase {
  switch (phase) {
    case 'idle':
      return event === 'press' ? 'holding' : 'idle'
    case 'holding':
      if (event === 'held') return 'fired'
      if (event === 'release') return 'idle'
      return 'holding'
    case 'fired':
      return event === 'click' || event === 'timeout' ? 'idle' : 'fired'
  }
}

/** A click counts as a tap only if it doesn't end a completed hold. */
export function clickIsTap(phase: PressPhase): boolean {
  return phase !== 'fired'
}
