import { describe, expect, it } from 'vitest'
import { markBuilt } from '../../src/logic/building'
import { claimBuilder, claimSlot } from '../../src/logic/claims'
import { triggerCrisis } from '../../src/logic/crises'
import { setSeason } from '../../src/logic/seasons'
import { createGame } from '../../src/logic/state'
import {
  createLocalStore,
  parseGame,
  SAVE_VERSION,
  type KeyValueStorage,
} from '../../src/storage/store'
import { gameWith } from './helpers'

/** An in-memory stand-in for the phone's localStorage. */
function fakeStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

/** A storage that throws on every call, like some private-browsing modes. */
const brokenStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error('denied')
  },
  setItem: () => {
    throw new Error('denied')
  },
  removeItem: () => {
    throw new Error('denied')
  },
}

function busyGame() {
  let game = gameWith('wilson', 'willow', 'wendy')
  game = claimSlot(game, 'p1', 'science-machine', 1)
  game = claimBuilder(game, 'p2', 'science-machine')
  game = markBuilt(game, 'backpack') // 1 of 3
  game = markBuilt(game, 'crock-pot')
  game = setSeason(game, 'winter')
  game = triggerCrisis(game, 'freezing')
  return game
}

describe('M4 saving on the phone', () => {
  it('nothing saved yet: loading gives nothing (start a new game)', () => {
    const store = createLocalStore(fakeStorage())
    expect(store.loadGame()).toBeNull()
    expect(store.loadMe()).toBeNull()
  })

  it('a saved game comes back exactly the same after a reload', () => {
    const storage = fakeStorage()
    const game = busyGame()
    createLocalStore(storage).saveGame(game)
    // A "reload": a brand-new store reading the same storage.
    expect(createLocalStore(storage).loadGame()).toEqual(game)
  })

  it('the device remembers which player it is', () => {
    const storage = fakeStorage()
    createLocalStore(storage).saveMe('p2')
    expect(createLocalStore(storage).loadMe()).toBe('p2')
  })

  it('forgetting the player clears it', () => {
    const storage = fakeStorage()
    const store = createLocalStore(storage)
    store.saveMe('p2')
    store.saveMe(null)
    expect(store.loadMe()).toBeNull()
  })

  it('a save from another version is ignored', () => {
    const storage = fakeStorage()
    storage.setItem(
      'dst-dashboard:game',
      JSON.stringify({ version: SAVE_VERSION + 1, game: createGame() }),
    )
    expect(createLocalStore(storage).loadGame()).toBeNull()
  })

  it('a damaged save is ignored instead of crashing', () => {
    const storage = fakeStorage()
    storage.setItem('dst-dashboard:game', '{not json')
    expect(createLocalStore(storage).loadGame()).toBeNull()
  })

  it('no storage at all: the app still works, it just forgets', () => {
    const store = createLocalStore(null)
    store.saveGame(createGame())
    expect(store.loadGame()).toBeNull()
  })

  it('storage that refuses to work does not crash the app', () => {
    const store = createLocalStore(brokenStorage)
    expect(() => store.saveGame(createGame())).not.toThrow()
    expect(() => store.saveMe('p1')).not.toThrow()
    expect(store.loadGame()).toBeNull()
    expect(store.loadMe()).toBeNull()
  })
})

describe('M4 checking a loaded save', () => {
  it('accepts a real game', () => {
    const game = busyGame()
    expect(parseGame(JSON.parse(JSON.stringify(game)))).toEqual(game)
  })

  it('rejects things that are not a game', () => {
    expect(parseGame(null)).toBeNull()
    expect(parseGame([])).toBeNull()
    expect(parseGame({ ...createGame(), season: 'monsoon' })).toBeNull()
    expect(parseGame({ ...createGame(), players: 'nobody' })).toBeNull()
  })

  it('rejects a player with an unknown character', () => {
    const game = gameWith('wilson')
    const bad = {
      ...game,
      players: [{ ...game.players[0], characterId: 'wilba' }],
    }
    expect(parseGame(bad)).toBeNull()
  })

  it('drops items and crises that no longer exist in the data', () => {
    const game = {
      ...createGame(),
      activeCrises: ['freezing', 'meteor-shower'],
      cards: {
        'old-item': { builder: null, claims: {}, checks: 0, built: true },
      },
    }
    expect(parseGame(game)).toMatchObject({
      activeCrises: ['freezing'],
      cards: {},
    })
  })

  it('drops claims by players who are not in the game', () => {
    const game = {
      ...gameWith('wilson'),
      cards: {
        'crock-pot': {
          builder: 'p7',
          claims: { 0: 'p1', 1: 'p7' },
          checks: 0,
          built: false,
        },
      },
    }
    expect(parseGame(game)?.cards['crock-pot']).toEqual({
      builder: null,
      claims: { 0: 'p1' },
      checks: 0,
      built: false,
    })
  })
})
