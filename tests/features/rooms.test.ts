import { describe, expect, it } from 'vitest'
import type { Action } from '../../src/logic/actions'
import { requiredChecks } from '../../src/logic/building'
import { addPlayer, joinRoom } from '../../src/logic/players'
import {
  makeRoomCode,
  myPlayer,
  nextSummary,
  normalizeRoomCode,
  replay,
  ROOM_WORDS,
  roomLink,
  SUMMARY_EVERY,
  type LoggedAction,
} from '../../src/logic/room'
import { cardOf, createGame } from '../../src/logic/state'
import { parseAction } from '../../src/storage/actionCodec'
import { createLocalStore, type KeyValueStorage } from '../../src/storage/store'

// Two phones in a room, identified by their device ids.
const ANA = 'device-ana'
const BEN = 'device-ben'
const room = () =>
  joinRoom(joinRoom(createGame(), ANA, 'wilson'), BEN, 'willow')

/** A log entry; `at` = when the server got it (null = still on its way). */
let nextId = 0
function entry(
  action: Action,
  at: number | null,
  sentAt = 0,
  id = `e${++nextId}`,
): LoggedAction {
  return { id, action, at, sentAt }
}
const tap = (playerId: string, slotIndex = 0): Action => ({
  type: 'tapSlot',
  playerId,
  itemId: 'science-machine',
  slotIndex,
})
const claimant = (state: ReturnType<typeof room>, slot = 0) =>
  cardOf(state, 'science-machine').claims[slot]

// ─────────────────────────────────────────────────────────────────────────
describe('M11 room codes', () => {
  it('a new code is a creature word and two digits', () => {
    expect(makeRoomCode(() => 0)).toBe(`${ROOM_WORDS[0]}-00`)
    expect(makeRoomCode(() => 0.999)).toBe(`${ROOM_WORDS.at(-1)}-99`)
    expect(makeRoomCode()).toMatch(/^[A-Z]+-\d\d$/)
  })

  it('reads a code however it is typed', () => {
    for (const typed of [
      'MOOSE-42',
      'moose-42',
      'Moose42',
      ' moose 42 ',
      'MOOSE_42',
    ])
      expect(normalizeRoomCode(typed)).toBe('MOOSE-42')
  })

  it('reads a code out of a pasted invite link', () => {
    expect(
      normalizeRoomCode('https://x.github.io/dst_dashboard/#room=MOOSE-42'),
    ).toBe('MOOSE-42')
  })

  it('rejects things that cannot be a code', () => {
    for (const bad of [
      '',
      'MOOSE',
      '42',
      'MOOSE-4',
      'MOOSE-421',
      'M-42',
      'MO0SE-42',
    ])
      expect(normalizeRoomCode(bad)).toBeNull()
  })

  it('the invite link points at the app with the code', () => {
    expect(roomLink('https://x.io/dst_dashboard/', 'BEE-07')).toBe(
      'https://x.io/dst_dashboard/#room=BEE-07',
    )
    expect(roomLink('https://x.io/dst_dashboard/#room=OLD-01', 'BEE-07')).toBe(
      'https://x.io/dst_dashboard/#room=BEE-07',
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────
describe('M11 joining a room', () => {
  it('a phone joins as itself, with the next free color', () => {
    const state = room()
    expect(state.players.map((p) => [p.id, p.characterId, p.color])).toEqual([
      [ANA, 'wilson', 'red'],
      [BEN, 'willow', 'blue'],
    ])
  })

  it('joining again only changes the character, never a second you', () => {
    const state = joinRoom(room(), ANA, 'wendy')
    expect(state.players).toHaveLength(2)
    expect(state.players[0]).toMatchObject({
      id: ANA,
      characterId: 'wendy',
      color: 'red',
    })
  })

  it('an unknown character or empty id is ignored', () => {
    const state = room()
    expect(joinRoom(state, 'device-x', 'nobody')).toBe(state)
    expect(joinRoom(state, '', 'wilson')).toBe(state)
  })

  it('N for per-player items = number of players in the room', () => {
    expect(requiredChecks(room(), 'backpack')).toBe(2)
    expect(
      requiredChecks(joinRoom(room(), 'device-cy', 'wx-78'), 'backpack'),
    ).toBe(3)
  })

  it('adding a player by hand next to device ids still gives p1, p2…', () => {
    const state = addPlayer(addPlayer(room(), 'wendy'), 'wx-78')
    expect(state.players.map((p) => p.id).slice(2)).toEqual(['p1', 'p2'])
  })

  it('this phone is "me" only once it has joined', () => {
    expect(myPlayer(room(), ANA)).toBe(ANA)
    expect(myPlayer(room(), 'device-new')).toBeNull()
    expect(myPlayer(room(), null)).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────
describe('M11 same-tap conflicts: the server decides who was first', () => {
  it('two taps on one slot: the first one the server got wins', () => {
    const log = [entry(tap(BEN), 2000), entry(tap(ANA), 1000)]
    expect(claimant(replay(room(), null, log))).toBe(ANA)
  })

  it('every phone agrees, whatever order the taps reached it in', () => {
    const a = entry(tap(ANA), 1000)
    const b = entry(tap(BEN), 1001)
    expect(claimant(replay(room(), null, [a, b]))).toBe(ANA)
    expect(claimant(replay(room(), null, [b, a]))).toBe(ANA)
  })

  it('the loser’s tap does nothing (it does not steal or release the slot)', () => {
    const log = [entry(tap(ANA), 1000), entry(tap(BEN), 1001)]
    const state = replay(room(), null, log)
    expect(claimant(state)).toBe(ANA)
    expect(state.players).toHaveLength(2)
  })

  it('my tap shows right away, before the server has it', () => {
    const log = [entry(tap(ANA), null, 5)]
    expect(claimant(replay(room(), null, log))).toBe(ANA)
  })

  it('…and if someone else got there first, it turns into theirs once confirmed', () => {
    const mine = entry(tap(ANA), null, 5)
    const before = replay(room(), null, [mine])
    expect(claimant(before)).toBe(ANA)
    // Ben's tap reached the server first; mine arrives later.
    const after = replay(room(), null, [
      { ...mine, at: 3000 },
      entry(tap(BEN), 2000),
    ])
    expect(claimant(after)).toBe(BEN)
  })

  it('taps still on their way keep the order they were made in', () => {
    // Both offline on this phone: Ana tapped first (sentAt 1), Ben second.
    const log = [entry(tap(BEN), null, 2), entry(tap(ANA), null, 1)]
    expect(claimant(replay(room(), null, log))).toBe(ANA)
  })

  it('equal server stamps are broken the same way everywhere', () => {
    const a = entry(tap(ANA), 1000, 0, 'aaa')
    const b = entry(tap(BEN), 1000, 0, 'bbb')
    expect(claimant(replay(room(), null, [b, a]))).toBe(ANA)
  })
})

// ─────────────────────────────────────────────────────────────────────────
describe('M11 room summaries (keeping it cheap)', () => {
  const online = { online: true, waiting: 0 }
  /** `n` confirmed taps alternating on slot 0/1, stamped 1, 2, 3… */
  const manyTaps = (n: number, from = 1) =>
    Array.from({ length: n }, (_, i) =>
      entry(tap(i % 2 ? BEN : ANA, i % 3), from + i),
    )

  it('nothing to summarize below the threshold', () => {
    expect(
      nextSummary(room(), null, manyTaps(SUMMARY_EVERY - 1), online),
    ).toBeNull()
  })

  it('at the threshold: a summary up to the last tap, equal to the board', () => {
    const log = manyTaps(SUMMARY_EVERY)
    const summary = nextSummary(room(), null, log, online)!
    expect(summary.upTo).toBe(SUMMARY_EVERY)
    expect(summary.state).toEqual(replay(room(), null, log))
  })

  it('never offline, or while this phone has taps on their way', () => {
    const log = manyTaps(SUMMARY_EVERY)
    expect(
      nextSummary(room(), null, log, { online: false, waiting: 0 }),
    ).toBeNull()
    expect(
      nextSummary(room(), null, log, { online: true, waiting: 1 }),
    ).toBeNull()
    expect(
      nextSummary(room(), null, [...log, entry(tap(ANA), null)], online),
    ).toBeNull()
  })

  it('taps already in the summary are never counted twice', () => {
    const log = manyTaps(SUMMARY_EVERY)
    const summary = nextSummary(room(), null, log, online)!
    const later = [...log, ...manyTaps(5, 1000)]
    expect(replay(summary.state, summary.upTo, later)).toEqual(
      replay(room(), null, later),
    )
  })

  it('counts only taps newer than the last summary', () => {
    const log = manyTaps(SUMMARY_EVERY + 10)
    expect(nextSummary(room(), 50, log, online)).toBeNull() // only 60 newer
  })
})

// ─────────────────────────────────────────────────────────────────────────
describe('M11 checking taps from other phones', () => {
  const valid: Action[] = [
    { type: 'newGame' },
    { type: 'addPlayer', characterId: 'wilson' },
    { type: 'joinRoom', playerId: ANA, characterId: 'wilson' },
    { type: 'pickCharacter', playerId: ANA, characterId: 'wendy' },
    { type: 'removePlayer', playerId: BEN },
    { type: 'toggleCooking', playerId: ANA },
    { type: 'claimSlot', playerId: ANA, itemId: 'backpack', slotIndex: 1 },
    { type: 'releaseSlot', playerId: ANA, itemId: 'backpack', slotIndex: 1 },
    { type: 'tapSlot', playerId: ANA, itemId: 'backpack', slotIndex: 0 },
    { type: 'claimBuilder', playerId: ANA, itemId: 'umbrella' },
    { type: 'releaseBuilder', playerId: ANA, itemId: 'umbrella' },
    { type: 'tapBuilder', playerId: ANA, itemId: 'umbrella' },
    { type: 'markBuilt', itemId: 'umbrella' },
    { type: 'restoreFromBuilt', itemId: 'umbrella' },
    { type: 'setSeason', season: 'winter' },
    { type: 'triggerCrisis', crisisId: 'freezing' },
    { type: 'endCrisis', crisisId: 'freezing' },
  ]

  it('every kind of action passes unchanged', () => {
    for (const action of valid) expect(parseAction(action)).toEqual(action)
  })

  it('extra fields are dropped', () => {
    expect(
      parseAction({ type: 'markBuilt', itemId: 'umbrella', evil: 1 }),
    ).toEqual({
      type: 'markBuilt',
      itemId: 'umbrella',
    })
  })

  it('anything else is rejected', () => {
    for (const bad of [
      null,
      'tapSlot',
      [],
      { type: 'explode' },
      { type: 'markBuilt', itemId: 'not-an-item' },
      { type: 'markBuilt', itemId: 'toString' }, // inherited, not an item
      { type: 'tapSlot', playerId: ANA, itemId: 'backpack', slotIndex: -1 },
      { type: 'tapSlot', playerId: ANA, itemId: 'backpack', slotIndex: 0.5 },
      { type: 'tapSlot', playerId: '', itemId: 'backpack', slotIndex: 0 },
      { type: 'setSeason', season: 'monsoon' },
      { type: 'triggerCrisis', crisisId: 'meteor' },
      { type: 'joinRoom', playerId: ANA, characterId: 'nobody' },
    ])
      expect(parseAction(bad)).toBeNull()
  })

  it('a slot past the item’s last ingredient is harmless (ignored by the rules)', () => {
    const action = parseAction({
      type: 'tapSlot',
      playerId: ANA,
      itemId: 'backpack',
      slotIndex: 99,
    })!
    const state = room()
    expect(replay(state, null, [entry(action, 1)])).toEqual(state)
  })
})

// ─────────────────────────────────────────────────────────────────────────
describe('M11 this phone remembers its room', () => {
  function fakeStorage(): KeyValueStorage {
    const data = new Map<string, string>()
    return {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
      removeItem: (k) => void data.delete(k),
    }
  }

  it('no room at first', () => {
    expect(createLocalStore(fakeStorage()).loadRoom()).toBeNull()
  })

  it('the room is remembered across restarts, and forgotten on leaving', () => {
    const storage = fakeStorage()
    createLocalStore(storage).saveRoom('MOOSE-42')
    expect(createLocalStore(storage).loadRoom()).toBe('MOOSE-42')
    createLocalStore(storage).saveRoom(null)
    expect(createLocalStore(storage).loadRoom()).toBeNull()
  })
})
