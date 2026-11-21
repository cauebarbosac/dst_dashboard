// Session state: everything that changes during play (M2).
// Pure data. Every change goes through a function that returns a NEW state
// and leaves the old one untouched (like returning a new dict instead of
// editing it in place).

import type { ItemId } from '../data/items'
import type { Season } from '../data/types'

export type PlayerId = string

/** Only 'cooking' for now; more activities may come later. */
export type Activity = 'none' | 'cooking'

export type Player = {
  id: PlayerId
  characterId: string
  /** Ring color, so two players with the same character can be told apart. */
  color: string
  activity: Activity
}

/**
 * The progress of one item. An item with no Card yet is simply fresh:
 * no builder, no claims, no checks, not built (see `cardOf`).
 */
export type Card = {
  builder: PlayerId | null
  /** Ingredient slot index → the player who claimed it. */
  claims: Partial<Record<number, PlayerId>>
  /** Long presses done so far (for items needed N times). */
  checks: number
  built: boolean
}

export type GameState = {
  players: Player[]
  season: Season
  /** Every season played so far, in order. Feeds Unfinished business. */
  seasonsSeen: Season[]
  /** Active crisis ids, oldest first, latest last. */
  activeCrises: string[]
  cards: Partial<Record<ItemId, Card>>
}

export const FRESH_CARD: Card = Object.freeze({
  builder: null,
  claims: {},
  checks: 0,
  built: false,
}) as Card

export function createGame(season: Season = 'autumn'): GameState {
  return {
    players: [],
    season,
    seasonsSeen: [season],
    activeCrises: [],
    cards: {},
  }
}

export function cardOf(state: GameState, itemId: ItemId): Card {
  return state.cards[itemId] ?? FRESH_CARD
}

export function findPlayer(
  state: GameState,
  playerId: PlayerId,
): Player | undefined {
  return state.players.find((p) => p.id === playerId)
}

/** Returns a new state with one item's card replaced. */
export function withCard(
  state: GameState,
  itemId: ItemId,
  card: Card,
): GameState {
  return { ...state, cards: { ...state.cards, [itemId]: card } }
}
