import { describe, expect, it } from 'vitest'
import {
  ARMED_MS,
  HOLD_MS,
  nextHoldPhase,
  type HoldEvent,
  type HoldPhase,
} from '../../src/ui/holdToConfirm'

/** Plays a list of events from `start` and returns the final phase. */
function play(events: HoldEvent[], start: HoldPhase = 'idle'): HoldPhase {
  return events.reduce(nextHoldPhase, start)
}

describe('M4 tap-then-hold confirm (remove player, new game)', () => {
  it('a first tap only arms the button', () => {
    expect(play(['tap'])).toBe('armed')
  })

  it('tapping again does not confirm: it has to be held', () => {
    expect(play(['tap', 'tap', 'tap'])).toBe('armed')
  })

  it('pressing an armed button starts the hold', () => {
    expect(play(['tap', 'press'])).toBe('holding')
  })

  it('holding long enough confirms', () => {
    expect(play(['tap', 'press', 'held'])).toBe('confirmed')
  })

  it('lifting the finger early cancels the hold but stays armed', () => {
    expect(play(['tap', 'press', 'release'])).toBe('armed')
  })

  it('a quick tap on an armed button (press, release, click) does not confirm', () => {
    expect(play(['tap', 'press', 'release', 'tap'])).toBe('armed')
  })

  it('an armed button disarms by itself after a while', () => {
    expect(play(['tap', 'timeout'])).toBe('idle')
  })

  it('the wait does not interrupt a hold in progress', () => {
    expect(play(['tap', 'press', 'timeout'])).toBe('holding')
  })

  it('pressing or holding an unarmed button does nothing', () => {
    expect(play(['press', 'held', 'release'])).toBe('idle')
  })

  it('the click after a completed hold does not arm the button again', () => {
    expect(play(['tap', 'press', 'held', 'release', 'tap'])).toBe('idle')
  })

  it('after confirming, the button goes back to idle by itself', () => {
    expect(play(['tap', 'press', 'held', 'timeout'])).toBe('idle')
  })

  it('the hold is long enough to be deliberate, and the arm waits longer than the hold', () => {
    expect(HOLD_MS).toBeGreaterThanOrEqual(1000)
    expect(ARMED_MS).toBeGreaterThan(HOLD_MS)
  })
})
