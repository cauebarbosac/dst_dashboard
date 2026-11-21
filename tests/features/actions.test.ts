import { describe, expect, it } from 'vitest'
import { applyAction, type Action } from '../../src/logic/actions'
import { cooks, topCrisis } from '../../src/logic/board'
import { cardOf, createGame } from '../../src/logic/state'

describe('M2 actions (the only way state changes)', () => {
  it('a sequence of actions plays out a small game', () => {
    const actions: Action[] = [
      { type: 'addPlayer', characterId: 'wilson' },
      { type: 'addPlayer', characterId: 'willow' },
      {
        type: 'claimSlot',
        playerId: 'p1',
        itemId: 'science-machine',
        slotIndex: 1,
      },
      { type: 'claimBuilder', playerId: 'p2', itemId: 'science-machine' },
      { type: 'toggleCooking', playerId: 'p2' },
      { type: 'triggerCrisis', crisisId: 'hound-wave' },
      { type: 'markBuilt', itemId: 'science-machine' },
      { type: 'setSeason', season: 'winter' },
    ]
    const game = actions.reduce(applyAction, createGame())
    expect(game.players).toHaveLength(2)
    expect(cardOf(game, 'science-machine').built).toBe(true)
    expect(cooks(game).map((p) => p.id)).toEqual(['p2'])
    expect(topCrisis(game)?.id).toBe('hound-wave')
    expect(game.season).toBe('winter')
  })

  it('every action type is handled', () => {
    let game = applyAction(createGame(), {
      type: 'addPlayer',
      characterId: 'wes',
    })
    const all: Action[] = [
      { type: 'pickCharacter', playerId: 'p1', characterId: 'warly' },
      { type: 'claimSlot', playerId: 'p1', itemId: 'crock-pot', slotIndex: 0 },
      {
        type: 'releaseSlot',
        playerId: 'p1',
        itemId: 'crock-pot',
        slotIndex: 0,
      },
      { type: 'claimBuilder', playerId: 'p1', itemId: 'crock-pot' },
      { type: 'releaseBuilder', playerId: 'p1', itemId: 'crock-pot' },
      { type: 'markBuilt', itemId: 'crock-pot' },
      { type: 'restoreFromBuilt', itemId: 'crock-pot' },
      { type: 'setSeason', season: 'summer' },
      { type: 'triggerCrisis', crisisId: 'freezing' },
      { type: 'endCrisis', crisisId: 'freezing' },
      { type: 'toggleCooking', playerId: 'p1' },
    ]
    for (const action of all) {
      const next = applyAction(game, action)
      expect(next, action.type).not.toBe(game) // each one changed something
      game = next
    }
  })

  it('actions never modify the old state (every change makes a new one)', () => {
    const before = applyAction(createGame(), {
      type: 'addPlayer',
      characterId: 'wilson',
    })
    const snapshot = structuredClone(before)
    applyAction(before, {
      type: 'claimSlot',
      playerId: 'p1',
      itemId: 'backpack',
      slotIndex: 0,
    })
    applyAction(before, { type: 'toggleCooking', playerId: 'p1' })
    applyAction(before, { type: 'triggerCrisis', crisisId: 'freezing' })
    applyAction(before, { type: 'setSeason', season: 'winter' })
    expect(before).toEqual(snapshot)
  })
})
