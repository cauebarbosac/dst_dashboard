// Checking taps that arrive from the shared room (M11). They come from
// other phones (maybe an older or newer app version), so anything that
// doesn't look exactly like a known action is dropped instead of reaching
// the rules, where an unknown item id would crash the app.

import { CHARACTERS } from '../data/characters'
import { CRISES } from '../data/crises'
import { ITEMS, type ItemId } from '../data/items'
import { SEASON_ORDER } from '../data/seasons'
import type { Season } from '../data/types'
import type { Action } from '../logic/actions'

type Fields = Record<string, unknown>

const isText = (x: unknown): x is string => typeof x === 'string' && x !== ''
const isItem = (x: unknown): x is ItemId =>
  typeof x === 'string' && Object.hasOwn(ITEMS, x)
const isSlot = (x: unknown): x is number =>
  typeof x === 'number' && Number.isInteger(x) && x >= 0
const isCharacter = (x: unknown): x is string =>
  CHARACTERS.some((c) => c.id === x)
const isCrisis = (x: unknown): x is string => CRISES.some((c) => c.id === x)
const isSeason = (x: unknown): x is Season => SEASON_ORDER.includes(x as Season)

/** Returns the action if it's well-formed, otherwise null. */
export function parseAction(x: unknown): Action | null {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return null
  const a = x as Fields
  switch (a.type) {
    case 'newGame':
      return { type: 'newGame' }
    case 'addPlayer':
      return isCharacter(a.characterId)
        ? { type: 'addPlayer', characterId: a.characterId }
        : null
    case 'joinRoom':
    case 'pickCharacter':
      return isText(a.playerId) && isCharacter(a.characterId)
        ? { type: a.type, playerId: a.playerId, characterId: a.characterId }
        : null
    case 'removePlayer':
    case 'toggleCooking':
      return isText(a.playerId) ? { type: a.type, playerId: a.playerId } : null
    case 'claimSlot':
    case 'releaseSlot':
    case 'tapSlot':
      return isText(a.playerId) && isItem(a.itemId) && isSlot(a.slotIndex)
        ? {
            type: a.type,
            playerId: a.playerId,
            itemId: a.itemId,
            slotIndex: a.slotIndex,
          }
        : null
    case 'claimBuilder':
    case 'releaseBuilder':
    case 'tapBuilder':
      return isText(a.playerId) && isItem(a.itemId)
        ? { type: a.type, playerId: a.playerId, itemId: a.itemId }
        : null
    case 'markBuilt':
    case 'restoreFromBuilt':
      return isItem(a.itemId) ? { type: a.type, itemId: a.itemId } : null
    case 'setSeason':
      return isSeason(a.season) ? { type: 'setSeason', season: a.season } : null
    case 'triggerCrisis':
    case 'endCrisis':
      return isCrisis(a.crisisId)
        ? { type: a.type, crisisId: a.crisisId }
        : null
    default:
      return null
  }
}
