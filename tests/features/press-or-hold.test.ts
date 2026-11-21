import { describe, expect, it } from 'vitest'
import {
  clickIsTap,
  nextPressPhase,
  type PressEvent,
  type PressPhase,
} from '../../src/ui/pressOrHold'

function play(events: PressEvent[], start: PressPhase = 'idle'): PressPhase {
  return events.reduce(nextPressPhase, start)
}

describe('M7 tap or hold on the same item', () => {
  it('finger down starts a hold', () => {
    expect(play(['press'])).toBe('holding')
  })

  it('lifting early makes it a tap (the click that follows counts)', () => {
    const phase = play(['press', 'release'])
    expect(phase).toBe('idle')
    expect(clickIsTap(phase)).toBe(true)
  })

  it('holding long enough fires the hold', () => {
    expect(play(['press', 'held'])).toBe('fired')
  })

  it('the click after a completed hold is not a tap', () => {
    const phase = play(['press', 'held', 'release'])
    expect(phase).toBe('fired')
    expect(clickIsTap(phase)).toBe(false)
  })

  it('after that click, the next tap works normally', () => {
    const phase = play(['press', 'held', 'release', 'click'])
    expect(phase).toBe('idle')
    expect(clickIsTap(phase)).toBe(true)
  })

  it('if no click comes after a hold, it resets by itself', () => {
    expect(play(['press', 'held', 'timeout'])).toBe('idle')
  })

  it('sliding off or scrolling cancels the hold', () => {
    expect(play(['press', 'release', 'held'])).toBe('idle')
  })

  it('a hold can only fire once per press', () => {
    expect(play(['press', 'held', 'held'])).toBe('fired')
  })
})
