import { ITEMS, type ItemId } from '../data/items'
import {
  cardOf,
  findPlayer,
  withCard,
  type GameState,
  type PlayerId,
} from './state'

// A claim means "I'm taking care of this": always the full amount of an
// ingredient, never a partial one. First claim wins; nobody can take or
// release someone else's claim.

function canClaim(
  state: GameState,
  playerId: PlayerId,
  itemId: ItemId,
): boolean {
  return (
    itemId in ITEMS &&
    findPlayer(state, playerId) !== undefined &&
    !cardOf(state, itemId).built
  )
}

function isSlot(itemId: ItemId, slotIndex: number): boolean {
  return (
    Number.isInteger(slotIndex) &&
    slotIndex >= 0 &&
    slotIndex < ITEMS[itemId].ingredients.length
  )
}

export function claimSlot(
  state: GameState,
  playerId: PlayerId,
  itemId: ItemId,
  slotIndex: number,
): GameState {
  if (!canClaim(state, playerId, itemId) || !isSlot(itemId, slotIndex))
    return state
  const card = cardOf(state, itemId)
  if (card.claims[slotIndex] !== undefined) return state // taken (even by me)
  return withCard(state, itemId, {
    ...card,
    claims: { ...card.claims, [slotIndex]: playerId },
  })
}

export function releaseSlot(
  state: GameState,
  playerId: PlayerId,
  itemId: ItemId,
  slotIndex: number,
): GameState {
  if (!(itemId in ITEMS)) return state
  const card = cardOf(state, itemId)
  if (card.claims[slotIndex] !== playerId) return state // not mine
  const claims = { ...card.claims }
  delete claims[slotIndex]
  return withCard(state, itemId, { ...card, claims })
}

export function claimBuilder(
  state: GameState,
  playerId: PlayerId,
  itemId: ItemId,
): GameState {
  if (!canClaim(state, playerId, itemId)) return state
  const card = cardOf(state, itemId)
  if (card.builder !== null) return state
  return withCard(state, itemId, { ...card, builder: playerId })
}

export function releaseBuilder(
  state: GameState,
  playerId: PlayerId,
  itemId: ItemId,
): GameState {
  if (!(itemId in ITEMS)) return state
  const card = cardOf(state, itemId)
  if (card.builder !== playerId) return state
  return withCard(state, itemId, { ...card, builder: null })
}

// ── One-tap toggles (what a tap on the screen means) ──

/** Tap a slot: empty → I claim it; mine → I release it; someone else's → nothing. */
export function tapSlot(
  state: GameState,
  playerId: PlayerId,
  itemId: ItemId,
  slotIndex: number,
): GameState {
  if (!(itemId in ITEMS)) return state
  return cardOf(state, itemId).claims[slotIndex] === playerId
    ? releaseSlot(state, playerId, itemId, slotIndex)
    : claimSlot(state, playerId, itemId, slotIndex)
}

/** Tap the item: same toggle for the builder role. */
export function tapBuilder(
  state: GameState,
  playerId: PlayerId,
  itemId: ItemId,
): GameState {
  if (!(itemId in ITEMS)) return state
  return cardOf(state, itemId).builder === playerId
    ? releaseBuilder(state, playerId, itemId)
    : claimBuilder(state, playerId, itemId)
}
