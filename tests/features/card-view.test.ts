import { describe, expect, it } from 'vitest'
import { markBuilt } from '../../src/logic/building'
import { claimBuilder, claimSlot } from '../../src/logic/claims'
import { removePlayer, toggleCooking } from '../../src/logic/players'
import { setSeason } from '../../src/logic/seasons'
import { boardView, cardView, playerTags } from '../../src/logic/view'
import { gameWith } from './helpers'

describe('M3 card view (what a card shows)', () => {
  it('shows the item name, its station and one slot per ingredient with the amount', () => {
    expect(cardView(gameWith('wilson'), 'alchemy-engine')).toEqual({
      itemId: 'alchemy-engine',
      name: 'Alchemy Engine',
      station: 'Science Machine',
      builder: null,
      slots: [
        { slotIndex: 0, name: 'Boards', amount: 4, claimedBy: null },
        { slotIndex: 1, name: 'Cut Stone', amount: 2, claimedBy: null },
        { slotIndex: 2, name: 'Electrical Doodad', amount: 2, claimedBy: null },
      ],
      checks: null,
    })
  })

  it('a hand-made item shows no station', () => {
    expect(cardView(gameWith('wilson'), 'science-machine').station).toBeNull()
  })

  it('a once-item shows no check slots', () => {
    expect(
      cardView(gameWith('wilson', 'willow'), 'crock-pot').checks,
    ).toBeNull()
  })

  it('a per-player item shows N check slots and how many are done', () => {
    let game = gameWith('wilson', 'willow', 'wendy')
    game = markBuilt(game, 'backpack')
    expect(cardView(game, 'backpack').checks).toEqual({ done: 1, required: 3 })
  })

  it('a per-player item with only one player shows no check slots', () => {
    expect(cardView(gameWith('wilson'), 'backpack').checks).toBeNull()
  })

  it("a claimed slot shows the claimer's tag and color ring", () => {
    const game = claimSlot(gameWith('wilson', 'willow'), 'p2', 'crock-pot', 1)
    expect(cardView(game, 'crock-pot').slots[1].claimedBy).toEqual({
      playerId: 'p2',
      label: 'WLO',
      color: 'blue',
    })
  })

  it('the builder shows as a tag on the item', () => {
    const game = claimBuilder(gameWith('wilson'), 'p1', 'crock-pot')
    expect(cardView(game, 'crock-pot').builder).toEqual({
      playerId: 'p1',
      label: 'WIL',
      color: 'red',
    })
  })
})

describe('M3 board view', () => {
  it('shows the season name and the visible cards in order', () => {
    const view = boardView(gameWith('wilson'))
    expect(view.seasonName).toBe('Autumn')
    expect(view.cards.map((c) => c.itemId)).toEqual([
      'science-machine',
      'alchemy-engine',
      'crock-pot',
    ])
  })

  it('counts the items hidden behind the visible cards', () => {
    expect(boardView(gameWith('wilson')).hiddenCount).toBe(3) // autumn has 6
  })

  it('nothing hidden when the list is shorter than the board', () => {
    const view = boardView(setSeason(gameWith('wilson'), 'spring'))
    expect(view.cards).toHaveLength(3)
    expect(view.hiddenCount).toBe(0)
  })

  it('an empty board when everything is built', () => {
    let game = setSeason(gameWith('wilson'), 'spring')
    for (const id of ['umbrella', 'rain-coat', 'lightning-rod'] as const)
      game = markBuilt(game, id)
    const view = boardView(game)
    expect(view).toMatchObject({
      seasonName: 'Spring',
      seasonIcon: '🌧️',
      cards: [],
      hiddenCount: 0,
      cooks: [],
    })
    // the game started in autumn, so autumn's items wait in Unfinished business
    expect(view.unfinished).toHaveLength(6)
  })
})

describe('M4 player tags', () => {
  it("lists every player's tag, color and character name, in joining order", () => {
    expect(playerTags(gameWith('wilson', 'wx-78'))).toEqual([
      { playerId: 'p1', label: 'WIL', color: 'red', name: 'Wilson' },
      { playerId: 'p2', label: 'WX', color: 'blue', name: 'WX-78' },
    ])
  })
})

describe('M5 who is cooking, on the board', () => {
  it('nobody cooking: no cooks shown', () => {
    expect(boardView(gameWith('wilson', 'willow')).cooks).toEqual([])
  })

  it("shows each cook's tag and color ring", () => {
    let game = gameWith('wilson', 'willow', 'warly')
    game = toggleCooking(game, 'p3')
    game = toggleCooking(game, 'p1')
    expect(boardView(game).cooks).toEqual([
      { playerId: 'p1', label: 'WIL', color: 'red' },
      { playerId: 'p3', label: 'WAR', color: 'green' },
    ])
  })

  it('a cook who is done disappears from the list', () => {
    let game = toggleCooking(gameWith('wilson'), 'p1')
    game = toggleCooking(game, 'p1')
    expect(boardView(game).cooks).toEqual([])
  })

  it('a cook who is removed from the game disappears too', () => {
    let game = toggleCooking(gameWith('wilson', 'willow'), 'p2')
    game = removePlayer(game, 'p2')
    expect(boardView(game).cooks).toEqual([])
  })
})
