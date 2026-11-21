import { describe, expect, it } from 'vitest'
import { markBuilt } from '../../src/logic/building'
import { claimBuilder, claimSlot, tapSlot } from '../../src/logic/claims'
import { triggerCrisis } from '../../src/logic/crises'
import { setSeason } from '../../src/logic/seasons'
import { myClaimsView } from '../../src/logic/view'
import { gameWith } from './helpers'

describe('M6 my claims screen', () => {
  it('nothing claimed: an empty list and a count of 0', () => {
    expect(myClaimsView(gameWith('wilson'), 'p1')).toEqual({
      items: [],
      count: 0,
    })
  })

  it('shows the item, its station and each ingredient I owe with the amount', () => {
    let game = gameWith('wilson')
    game = claimSlot(game, 'p1', 'alchemy-engine', 0)
    game = claimSlot(game, 'p1', 'alchemy-engine', 2)
    expect(myClaimsView(game, 'p1').items).toEqual([
      {
        itemId: 'alchemy-engine',
        name: 'Alchemy Engine',
        station: 'Science Machine',
        builder: false,
        slots: [
          { slotIndex: 0, name: 'Boards', amount: 4 },
          { slotIndex: 2, name: 'Electrical Doodad', amount: 2 },
        ],
      },
    ])
  })

  it('shows the items I am building, even with no ingredient claimed', () => {
    const game = claimBuilder(gameWith('wilson'), 'p1', 'science-machine')
    expect(myClaimsView(game, 'p1').items).toEqual([
      {
        itemId: 'science-machine',
        name: 'Science Machine',
        station: null,
        builder: true,
        slots: [],
      },
    ])
  })

  it('counts every promise: each ingredient plus each builder role', () => {
    let game = gameWith('wilson')
    game = claimSlot(game, 'p1', 'science-machine', 0)
    game = claimSlot(game, 'p1', 'science-machine', 1)
    game = claimBuilder(game, 'p1', 'science-machine')
    game = claimSlot(game, 'p1', 'crock-pot', 2)
    expect(myClaimsView(game, 'p1').count).toBe(4)
  })

  it("only shows mine, never other players' claims", () => {
    let game = gameWith('wilson', 'willow')
    game = claimSlot(game, 'p1', 'crock-pot', 0)
    game = claimSlot(game, 'p2', 'crock-pot', 1)
    game = claimBuilder(game, 'p2', 'crock-pot')
    expect(myClaimsView(game, 'p1').items[0]).toMatchObject({
      builder: false,
      slots: [{ slotIndex: 0 }],
    })
    expect(myClaimsView(game, 'p1').count).toBe(1)
  })

  it('covers crisis items, season items and Unfinished business, board first', () => {
    let game = gameWith('wilson')
    game = claimSlot(game, 'p1', 'backpack', 0) // autumn
    game = setSeason(game, 'winter') // backpack -> Unfinished business
    game = claimSlot(game, 'p1', 'puffy-vest', 1) // winter board
    game = triggerCrisis(game, 'teammate-down')
    game = claimSlot(game, 'p1', 'booster-shot', 2) // crisis, top of board
    expect(myClaimsView(game, 'p1').items.map((i) => i.itemId)).toEqual([
      'booster-shot',
      'puffy-vest',
      'backpack',
    ])
  })

  it('releasing from the list (a tap on my own claim) removes it', () => {
    let game = claimSlot(gameWith('wilson'), 'p1', 'crock-pot', 0)
    game = tapSlot(game, 'p1', 'crock-pot', 0)
    expect(myClaimsView(game, 'p1')).toEqual({ items: [], count: 0 })
  })

  it('a built item is no longer a promise', () => {
    let game = claimSlot(gameWith('wilson'), 'p1', 'crock-pot', 0)
    game = markBuilt(game, 'crock-pot')
    expect(myClaimsView(game, 'p1').count).toBe(0)
  })
})
