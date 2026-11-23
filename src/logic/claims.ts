import { ITEMS, type ItemId } from '../data/items'
import {
  cardOf,
  findPlayer,
  withCard,
  type GameState,
  type PlayerId,
} from './state'

// A claim means "I'm taking care of this": always the full amount of an
// ingredient, never a partial one. Up to MAX_CLAIMERS players can claim the
// same ingredient (the second one is helping, or happens to be near it).
// The first MAX_CLAIMERS taps win; nobody can take or release someone
// else's claim. The builder role stays one player.

/** How many players can claim one ingredient slot. */
export const MAX_CLAIMERS = 2

/** Who claimed a slot, first claimer first (empty when nobody). */
export function claimersOf(
  state: GameState,
  itemId: ItemId,
  slotIndex: number,
): PlayerId[] {
  return cardOf(state, itemId).claims[slotIndex] ?? []
}

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
  const claimers = card.claims[slotIndex] ?? []
  if (claimers.includes(playerId)) return state // already mine
  if (claimers.length >= MAX_CLAIMERS) return state // full
  return withCard(state, itemId, {
    ...card,
    claims: { ...card.claims, [slotIndex]: [...claimers, playerId] },
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
  const claimers = card.claims[slotIndex] ?? []
  if (!claimers.includes(playerId)) return state // not mine
  const rest = claimers.filter((id) => id !== playerId)
  const claims = { ...card.claims }
  if (rest.length > 0) claims[slotIndex] = rest
  else delete claims[slotIndex]
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

/**
 * Tap a slot: mine → I release it; room left (fewer than MAX_CLAIMERS) →
 * I join; full with others → nothing.
 */
export function tapSlot(
  state: GameState,
  playerId: PlayerId,
  itemId: ItemId,
  slotIndex: number,
): GameState {
  if (!(itemId in ITEMS)) return state
  return claimersOf(state, itemId, slotIndex).includes(playerId)
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
