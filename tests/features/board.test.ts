import { describe, expect, it } from 'vitest'
import { SEASON_LISTS } from '../../src/data/seasons'
import {
  BOARD_SIZE,
  boardQueue,
  myClaims,
  visibleBoard,
} from '../../src/logic/board'
import { markBuilt } from '../../src/logic/building'
import { claimBuilder, claimSlot } from '../../src/logic/claims'
import { setSeason } from '../../src/logic/seasons'
import { gameWith } from './helpers'

describe('M2 board rule', () => {
  it('shows the top cards of the season list, in priority order', () => {
    const game = gameWith('wilson')
    expect(visibleBoard(game)).toEqual(SEASON_LISTS.autumn.slice(0, BOARD_SIZE))
  })

  it('the rest of the list stays hidden until cards are finished', () => {
    let game = gameWith('wilson')
    game = markBuilt(game, 'science-machine')
    // BOARD_SIZE went 3 → 6 (2026-11-23): check the top 3, as before.
    expect(visibleBoard(game, 3)).toEqual([
      'alchemy-engine',
      'crock-pot',
      'ice-box',
    ])
  })

  it('the visible size can be tuned', () => {
    expect(visibleBoard(gameWith('wilson'), 4)).toHaveLength(4)
  })

  it('when everything is built, the board is empty', () => {
    let game = setSeason(gameWith('wilson'), 'spring')
    for (const id of SEASON_LISTS.spring) game = markBuilt(game, id)
    expect(boardQueue(game)).toEqual([])
    expect(visibleBoard(game)).toEqual([])
  })
})

describe('M2 my claims', () => {
  it('is empty when I have not claimed anything', () => {
    expect(myClaims(gameWith('wilson'), 'p1')).toEqual([])
  })

  it('lists the ingredients I owe, per item, with the amount to bring', () => {
    let game = gameWith('wilson')
    game = claimSlot(game, 'p1', 'science-machine', 1)
    expect(myClaims(game, 'p1')).toEqual([
      {
        itemId: 'science-machine',
        builder: false,
        slots: [{ slotIndex: 1, ingredient: { name: 'Log', amount: 4 } }],
      },
    ])
  })

  it('lists the items I am building', () => {
    const game = claimBuilder(gameWith('wilson'), 'p1', 'crock-pot')
    expect(myClaims(game, 'p1')).toEqual([
      { itemId: 'crock-pot', builder: true, slots: [] },
    ])
  })

  it("shows only my claims, not other players'", () => {
    let game = gameWith('wilson', 'willow')
    game = claimSlot(game, 'p1', 'science-machine', 0)
    game = claimSlot(game, 'p2', 'science-machine', 1)
    expect(myClaims(game, 'p2')[0].slots.map((s) => s.slotIndex)).toEqual([1])
  })

  it('covers season, crisis and Unfinished business items, board first', () => {
    let game = gameWith('wilson')
    game = claimSlot(game, 'p1', 'backpack', 0) // autumn
    game = setSeason(game, 'winter') // backpack → Unfinished business
    game = claimSlot(game, 'p1', 'winter-hat', 1) // winter board
    expect(myClaims(game, 'p1').map((c) => c.itemId)).toEqual([
      'winter-hat',
      'backpack',
    ])
  })

  it('built items drop out of my claims', () => {
    let game = claimSlot(gameWith('wilson'), 'p1', 'science-machine', 0)
    game = markBuilt(game, 'science-machine')
    expect(myClaims(game, 'p1')).toEqual([])
  })
})

describe('Board size: the whole season, up to 6 (2026-11-23)', () => {
  it('shows up to 6 cards', () => {
    expect(BOARD_SIZE).toBe(6)
  })

  it('a season with fewer than 6 items shows all of them', () => {
    const game = setSeason(gameWith('wilson'), 'winter')
    expect(visibleBoard(game)).toEqual(SEASON_LISTS.winter)
  })

  it('a season with more than 6 items shows its first 6 (autumn has 8)', () => {
    expect(SEASON_LISTS.autumn.length).toBeGreaterThan(6)
    expect(visibleBoard(gameWith('wilson'))).toEqual(
      SEASON_LISTS.autumn.slice(0, 6),
    )
  })
})
