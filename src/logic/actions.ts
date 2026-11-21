// The only ways the state can change. The UI sends one of these actions
// to `applyAction` (a "reducer": `def apply(state, action) -> new_state`).

import type { ItemId } from '../data/items'
import type { Season } from '../data/types'
import { markBuilt, restoreFromBuilt } from './building'
import {
  claimBuilder,
  claimSlot,
  releaseBuilder,
  releaseSlot,
  tapBuilder,
  tapSlot,
} from './claims'
import { endCrisis, triggerCrisis } from './crises'
import {
  addPlayer,
  pickCharacter,
  removePlayer,
  toggleCooking,
} from './players'
import { setSeason } from './seasons'
import { createGame, type GameState, type PlayerId } from './state'

// A "discriminated union": each action is a small object tagged by `type`,
// like a set of dataclasses that `match action:` can tell apart.
export type Action =
  | { type: 'newGame' }
  | { type: 'addPlayer'; characterId: string }
  | { type: 'removePlayer'; playerId: PlayerId }
  | { type: 'pickCharacter'; playerId: PlayerId; characterId: string }
  | { type: 'claimSlot'; playerId: PlayerId; itemId: ItemId; slotIndex: number }
  | {
      type: 'releaseSlot'
      playerId: PlayerId
      itemId: ItemId
      slotIndex: number
    }
  | { type: 'claimBuilder'; playerId: PlayerId; itemId: ItemId }
  | { type: 'releaseBuilder'; playerId: PlayerId; itemId: ItemId }
  | { type: 'tapSlot'; playerId: PlayerId; itemId: ItemId; slotIndex: number }
  | { type: 'tapBuilder'; playerId: PlayerId; itemId: ItemId }
  | { type: 'markBuilt'; itemId: ItemId }
  | { type: 'restoreFromBuilt'; itemId: ItemId }
  | { type: 'setSeason'; season: Season }
  | { type: 'triggerCrisis'; crisisId: string }
  | { type: 'endCrisis'; crisisId: string }
  | { type: 'toggleCooking'; playerId: PlayerId }

export function applyAction(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'newGame':
      return createGame()
    case 'addPlayer':
      return addPlayer(state, action.characterId)
    case 'removePlayer':
      return removePlayer(state, action.playerId)
    case 'pickCharacter':
      return pickCharacter(state, action.playerId, action.characterId)
    case 'claimSlot':
      return claimSlot(state, action.playerId, action.itemId, action.slotIndex)
    case 'releaseSlot':
      return releaseSlot(
        state,
        action.playerId,
        action.itemId,
        action.slotIndex,
      )
    case 'claimBuilder':
      return claimBuilder(state, action.playerId, action.itemId)
    case 'releaseBuilder':
      return releaseBuilder(state, action.playerId, action.itemId)
    case 'tapSlot':
      return tapSlot(state, action.playerId, action.itemId, action.slotIndex)
    case 'tapBuilder':
      return tapBuilder(state, action.playerId, action.itemId)
    case 'markBuilt':
      return markBuilt(state, action.itemId)
    case 'restoreFromBuilt':
      return restoreFromBuilt(state, action.itemId)
    case 'setSeason':
      return setSeason(state, action.season)
    case 'triggerCrisis':
      return triggerCrisis(state, action.crisisId)
    case 'endCrisis':
      return endCrisis(state, action.crisisId)
    case 'toggleCooking':
      return toggleCooking(state, action.playerId)
  }
}
