// Storage adapter (M4). The app only talks to a `GameStore`; where the data
// actually lives is hidden behind it. Phase 1 = this phone (localStorage),
// M11 = a hosted service, with no change to src/logic/.
//
// Python analogy: `GameStore` is an abstract base class, and
// `createLocalStore` returns one concrete implementation.

import { CHARACTERS } from '../data/characters'
import { CRISES } from '../data/crises'
import { ITEMS } from '../data/items'
import { SEASON_ORDER } from '../data/seasons'
import type { Season } from '../data/types'
import type { Card, GameState, Player, PlayerId } from '../logic/state'

export type GameStore = {
  loadGame(): GameState | null
  saveGame(game: GameState): void
  /** "I am this player" belongs to the device, not to the shared game. */
  loadMe(): PlayerId | null
  saveMe(playerId: PlayerId | null): void
  /** "Keep screen awake" (M10), also per device. On unless turned off. */
  loadKeepAwake(): boolean
  saveKeepAwake(on: boolean): void
}

/** The part of the browser's localStorage we use (easy to fake in tests). */
export type KeyValueStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>

const GAME_KEY = 'dst-dashboard:game'
const ME_KEY = 'dst-dashboard:me'
const KEEP_AWAKE_KEY = 'dst-dashboard:keep-awake'
/** Bump when the saved shape changes; older saves are then ignored. */
export const SAVE_VERSION = 1

export function createLocalStore(storage: KeyValueStorage | null): GameStore {
  // Storage can be missing or refuse to work (private browsing, full disk).
  // Then the app still runs, it just doesn't remember anything.
  function read(key: string): string | null {
    try {
      return storage?.getItem(key) ?? null
    } catch {
      return null
    }
  }
  function write(key: string, value: string | null): void {
    try {
      if (value === null) storage?.removeItem(key)
      else storage?.setItem(key, value)
    } catch {
      // ignore: not saving is better than crashing mid-game
    }
  }

  return {
    loadGame() {
      const raw = read(GAME_KEY)
      if (raw === null) return null
      try {
        const saved: unknown = JSON.parse(raw)
        if (!isObject(saved) || saved.version !== SAVE_VERSION) return null
        return parseGame(saved.game)
      } catch {
        return null
      }
    },
    saveGame(game) {
      write(GAME_KEY, JSON.stringify({ version: SAVE_VERSION, game }))
    },
    loadMe() {
      return read(ME_KEY)
    },
    saveMe(playerId) {
      write(ME_KEY, playerId)
    },
    loadKeepAwake() {
      return read(KEEP_AWAKE_KEY) !== 'off'
    },
    saveKeepAwake(on) {
      write(KEEP_AWAKE_KEY, on ? 'on' : 'off')
    },
  }
}

/** The browser's localStorage, or null where there is none (e.g. tests). */
export function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

// ── Checking a loaded save ──
// A save could be from an older version, edited by hand or half-written.
// Anything that doesn't look right is rejected (start fresh) instead of
// crashing the app later.

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function isSeason(x: unknown): x is Season {
  return SEASON_ORDER.includes(x as Season)
}

function parsePlayer(x: unknown): Player | null {
  if (!isObject(x)) return null
  const { id, characterId, color, activity } = x
  if (typeof id !== 'string' || typeof color !== 'string') return null
  if (!CHARACTERS.some((c) => c.id === characterId)) return null
  if (activity !== 'none' && activity !== 'cooking') return null
  return { id, characterId: characterId as string, color, activity }
}

function parseCard(x: unknown, playerIds: Set<string>): Card | null {
  if (!isObject(x)) return null
  const { builder, claims, checks, built } = x
  if (typeof checks !== 'number' || typeof built !== 'boolean') return null
  if (!isObject(claims)) return null
  const validClaims: Card['claims'] = {}
  for (const [slot, who] of Object.entries(claims)) {
    if (typeof who === 'string' && playerIds.has(who))
      validClaims[Number(slot)] = who
  }
  return {
    builder:
      typeof builder === 'string' && playerIds.has(builder) ? builder : null,
    claims: validClaims,
    checks,
    built,
  }
}

export function parseGame(x: unknown): GameState | null {
  if (!isObject(x)) return null
  const { players, season, seasonsSeen, activeCrises, cards } = x
  if (!Array.isArray(players) || !isSeason(season)) return null
  if (!Array.isArray(seasonsSeen) || !seasonsSeen.every(isSeason)) return null
  if (!Array.isArray(activeCrises) || !isObject(cards)) return null

  const parsedPlayers = players.map(parsePlayer)
  if (parsedPlayers.some((p) => p === null)) return null
  const okPlayers = parsedPlayers as Player[]
  const playerIds = new Set(okPlayers.map((p) => p.id))

  const okCards: GameState['cards'] = {}
  for (const [itemId, card] of Object.entries(cards)) {
    if (!(itemId in ITEMS)) continue // an item removed from the data: drop it
    const parsed = parseCard(card, playerIds)
    if (parsed) okCards[itemId as keyof typeof ITEMS] = parsed
  }

  return {
    players: okPlayers,
    season,
    seasonsSeen,
    // a crisis removed from the data: drop it
    activeCrises: activeCrises.filter(
      (id): id is string =>
        typeof id === 'string' && CRISES.some((c) => c.id === id),
    ),
    cards: okCards,
  }
}
