import { describe, expect, it } from 'vitest'
import { builtItems, visibleBoard } from '../../src/logic/board'
import {
  markBuilt,
  requiredChecks,
  restoreFromBuilt,
} from '../../src/logic/building'
import { claimBuilder, claimSlot } from '../../src/logic/claims'
import { addPlayer } from '../../src/logic/players'
import { cardOf, createGame, FRESH_CARD } from '../../src/logic/state'
import { gameWith, repeat } from './helpers'

const SM = 'science-machine' // once
const BACKPACK = 'backpack' // perPlayer

describe('M2 building and quantities', () => {
  it('a once-item needs 1 check', () => {
    expect(requiredChecks(gameWith('wilson', 'willow'), SM)).toBe(1)
  })

  it('a per-player item needs N checks, N = number of players', () => {
    expect(
      requiredChecks(gameWith('wilson', 'willow', 'wendy'), BACKPACK),
    ).toBe(3)
  })

  it('N follows the player count when a player joins', () => {
    const two = gameWith('wilson', 'willow')
    expect(requiredChecks(addPlayer(two, 'wendy'), BACKPACK)).toBe(3)
  })

  it('with no players yet, a per-player item still needs 1 check', () => {
    expect(requiredChecks(createGame(), BACKPACK)).toBe(1)
  })

  it('one long press builds a once-item and it leaves the board', () => {
    const game = markBuilt(gameWith('wilson'), SM)
    expect(cardOf(game, SM).built).toBe(true)
    expect(visibleBoard(game)).not.toContain(SM)
    expect(builtItems(game)).toEqual([SM])
  })

  it('anyone can mark it built, not only the builder', () => {
    let game = claimBuilder(gameWith('wilson', 'willow'), 'p1', SM)
    game = markBuilt(game, SM) // no player needed
    expect(cardOf(game, SM).built).toBe(true)
  })

  it('a per-player item fills one check per long press and stays until all N are done', () => {
    let game = gameWith('wilson', 'willow', 'wendy')
    game = repeat(game, 2, (s) => markBuilt(s, BACKPACK))
    expect(cardOf(game, BACKPACK)).toMatchObject({ checks: 2, built: false })
    game = markBuilt(game, BACKPACK)
    expect(cardOf(game, BACKPACK).built).toBe(true)
  })

  it('claims stay on the card until the last check', () => {
    let game = gameWith('wilson', 'willow')
    game = claimSlot(game, 'p1', BACKPACK, 0)
    game = claimBuilder(game, 'p2', BACKPACK)
    game = markBuilt(game, BACKPACK) // 1 of 2
    expect(cardOf(game, BACKPACK)).toMatchObject({
      claims: { 0: 'p1' },
      builder: 'p2',
      checks: 1,
    })
  })

  it('when the item is finished, its claims are cleared', () => {
    let game = claimSlot(gameWith('wilson'), 'p1', SM, 0)
    game = markBuilt(game, SM)
    expect(cardOf(game, SM)).toEqual({ ...FRESH_CARD, built: true })
  })

  it('long-pressing an item that is already built changes nothing', () => {
    const game = markBuilt(gameWith('wilson'), SM)
    expect(markBuilt(game, SM)).toBe(game)
  })
})

describe('M2 restoring from the Built list', () => {
  it('a built item goes back to the board', () => {
    let game = markBuilt(gameWith('wilson'), SM)
    game = restoreFromBuilt(game, SM)
    expect(builtItems(game)).toEqual([])
    expect(visibleBoard(game)).toContain(SM)
  })

  it('it comes back fresh: no claims, no builder, no checks', () => {
    let game = gameWith('wilson', 'willow')
    game = claimSlot(game, 'p1', BACKPACK, 0)
    game = repeat(game, 2, (s) => markBuilt(s, BACKPACK))
    game = restoreFromBuilt(game, BACKPACK)
    expect(cardOf(game, BACKPACK)).toEqual(FRESH_CARD)
  })

  it('a restored item can be built again (e.g. one more Booster Shot)', () => {
    let game = markBuilt(gameWith('wilson'), 'booster-shot')
    game = markBuilt(restoreFromBuilt(game, 'booster-shot'), 'booster-shot')
    expect(cardOf(game, 'booster-shot').built).toBe(true)
  })

  it('restoring an item that is not built changes nothing', () => {
    const game = gameWith('wilson')
    expect(restoreFromBuilt(game, SM)).toBe(game)
  })
})
