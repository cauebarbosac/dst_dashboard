// "Tap, then hold" for actions that lose data (remove a player, new game).
// A tiny state machine, kept pure so it can be tested without a browser:
//
//   idle ──tap──▶ armed ──press──▶ holding ──(held HOLD_MS)──▶ confirmed
//                  ▲  │               │
//                  │  └──timeout──▶ idle
//                  └────release───────┘   (lifted early or slid off: cancel)
//
// `confirmed` swallows the click the browser sends when the finger lifts
// after a completed hold, so that click doesn't arm the button again.

/** How long to hold. Tune on the phone; M7's long press can reuse it. */
export const HOLD_MS = 1500
/** How long the button stays armed waiting for the hold. */
export const ARMED_MS = 4000

export type HoldPhase = 'idle' | 'armed' | 'holding' | 'confirmed'

export type HoldEvent =
  | 'tap' // a click (finger down + up)
  | 'press' // finger down
  | 'release' // finger up, slid off, or the browser cancelled the touch
  | 'held' // finger stayed down for HOLD_MS
  | 'timeout' // armed for ARMED_MS (or confirmed) without anything happening

export function nextHoldPhase(phase: HoldPhase, event: HoldEvent): HoldPhase {
  switch (phase) {
    case 'idle':
      return event === 'tap' ? 'armed' : 'idle'
    case 'armed':
      if (event === 'press') return 'holding'
      if (event === 'timeout') return 'idle'
      return 'armed'
    case 'holding':
      if (event === 'held') return 'confirmed'
      if (event === 'release') return 'armed'
      return 'holding'
    case 'confirmed':
      return event === 'tap' || event === 'timeout' ? 'idle' : 'confirmed'
  }
}
