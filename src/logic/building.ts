import { ITEMS, type ItemId } from '../data/items'
import { cardOf, FRESH_CARD, withCard, type GameState } from './state'

/**
 * How many long presses an item needs: 1 for a `once` item, N = number of
 * players for a `perPlayer` item (at least 1, so a game with no players
 * still works).
 */
export function requiredChecks(state: GameState, itemId: ItemId): number {
  return ITEMS[itemId].quantity === 'once'
    ? 1
    : Math.max(1, state.players.length)
}

/**
 * One long press = one check. Anyone can do it. Claims stay on the card
 * until the last check; then the item is built and its card is cleared.
 */
export function markBuilt(state: GameState, itemId: ItemId): GameState {
  if (!(itemId in ITEMS)) return state
  const card = cardOf(state, itemId)
  if (card.built) return state
  const checks = card.checks + 1
  if (checks >= requiredChecks(state, itemId)) {
    return withCard(state, itemId, { ...FRESH_CARD, built: true })
  }
  return withCard(state, itemId, { ...card, checks })
}

/** Long press in the Built list: the item goes back to the board, fresh. */
export function restoreFromBuilt(state: GameState, itemId: ItemId): GameState {
  if (!cardOf(state, itemId).built) return state
  const cards = { ...state.cards }
  delete cards[itemId]
  return { ...state, cards }
}
