import { describe, expect, it } from 'vitest'
import { markBuilt } from '../../src/logic/building'
import {
  claimBuilder,
  claimSlot,
  releaseBuilder,
  releaseSlot,
} from '../../src/logic/claims'
import { cardOf } from '../../src/logic/state'
import { gameWith } from './helpers'

// Science Machine: slot 0 Gold Nugget, slot 1 Log, slot 2 Rocks.
const SM = 'science-machine'

describe('M2 claiming ingredients', () => {
  it('tapping an empty slot claims it', () => {
    const game = claimSlot(gameWith('wilson'), 'p1', SM, 1)
    expect(cardOf(game, SM).claims).toEqual({ 1: 'p1' })
  })

  it('tapping your own claim releases it', () => {
    let game = claimSlot(gameWith('wilson'), 'p1', SM, 1)
    game = releaseSlot(game, 'p1', SM, 1)
    expect(cardOf(game, SM).claims).toEqual({})
  })

  it('a slot already claimed by someone else stays theirs (first claim wins)', () => {
    let game = claimSlot(gameWith('wilson', 'willow'), 'p1', SM, 0)
    game = claimSlot(game, 'p2', SM, 0)
    expect(cardOf(game, SM).claims).toEqual({ 0: 'p1' })
  })

  it("you can't release someone else's claim", () => {
    let game = claimSlot(gameWith('wilson', 'willow'), 'p1', SM, 0)
    game = releaseSlot(game, 'p2', SM, 0)
    expect(cardOf(game, SM).claims).toEqual({ 0: 'p1' })
  })

  it('claiming the same slot twice changes nothing', () => {
    const once = claimSlot(gameWith('wilson'), 'p1', SM, 0)
    expect(claimSlot(once, 'p1', SM, 0)).toBe(once)
  })

  it('releasing an empty slot changes nothing', () => {
    const game = gameWith('wilson')
    expect(releaseSlot(game, 'p1', SM, 0)).toBe(game)
  })

  it('one item can be split: p1 brings Logs, p2 Rocks, p3 builds', () => {
    let game = gameWith('wilson', 'willow', 'wendy')
    game = claimSlot(game, 'p1', SM, 1)
    game = claimSlot(game, 'p2', SM, 2)
    game = claimBuilder(game, 'p3', SM)
    expect(cardOf(game, SM)).toMatchObject({
      claims: { 1: 'p1', 2: 'p2' },
      builder: 'p3',
    })
  })

  it('one player can claim several slots of the same item', () => {
    let game = claimSlot(gameWith('wilson'), 'p1', SM, 0)
    game = claimSlot(game, 'p1', SM, 2)
    expect(cardOf(game, SM).claims).toEqual({ 0: 'p1', 2: 'p1' })
  })

  it('a slot that does not exist is ignored', () => {
    const game = gameWith('wilson')
    expect(claimSlot(game, 'p1', SM, 3)).toBe(game)
    expect(claimSlot(game, 'p1', SM, -1)).toBe(game)
    expect(claimSlot(game, 'p1', SM, 0.5)).toBe(game)
  })

  it('an unknown player cannot claim', () => {
    const game = gameWith('wilson')
    expect(claimSlot(game, 'p9', SM, 0)).toBe(game)
  })

  it('a built item cannot be claimed', () => {
    const game = markBuilt(gameWith('wilson'), SM)
    expect(claimSlot(game, 'p1', SM, 0)).toBe(game)
  })
})

describe('M2 builder claim', () => {
  it('tapping the item claims the builder role', () => {
    const game = claimBuilder(gameWith('wilson'), 'p1', SM)
    expect(cardOf(game, SM).builder).toBe('p1')
  })

  it('tapping it again releases the builder role', () => {
    let game = claimBuilder(gameWith('wilson'), 'p1', SM)
    game = releaseBuilder(game, 'p1', SM)
    expect(cardOf(game, SM).builder).toBeNull()
  })

  it('only one builder: a second player cannot take it', () => {
    let game = claimBuilder(gameWith('wilson', 'willow'), 'p1', SM)
    game = claimBuilder(game, 'p2', SM)
    expect(cardOf(game, SM).builder).toBe('p1')
  })

  it("you can't release someone else's builder role", () => {
    let game = claimBuilder(gameWith('wilson', 'willow'), 'p1', SM)
    game = releaseBuilder(game, 'p2', SM)
    expect(cardOf(game, SM).builder).toBe('p1')
  })

  it('the builder can also bring an ingredient', () => {
    let game = claimBuilder(gameWith('wilson'), 'p1', SM)
    game = claimSlot(game, 'p1', SM, 0)
    expect(cardOf(game, SM)).toMatchObject({
      builder: 'p1',
      claims: { 0: 'p1' },
    })
  })
})
