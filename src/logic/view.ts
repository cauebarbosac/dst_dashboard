// View models: exactly what one card (or the board header) needs to draw,
// already worked out. The React components only display these.

import { CHARACTERS } from '../data/characters'
import { ITEMS, type ItemId } from '../data/items'
import { SEASON_ICONS, SEASON_NAMES } from '../data/seasons'
import { STATIONS } from '../data/stations'
import { boardQueue, builtItems, cooks, myClaims, visibleBoard } from './board'
import { requiredChecks } from './building'
import { cardOf, findPlayer, type GameState, type PlayerId } from './state'

/** A claim drawn as a name tag in the player's color ring. */
export type Tag = { playerId: PlayerId; label: string; color: string }

export type SlotView = {
  slotIndex: number
  name: string
  amount: number
  claimedBy: Tag | null
}

export type CardView = {
  itemId: ItemId
  name: string
  /** Where it's crafted, e.g. "Alchemy Engine". Null when made by hand. */
  station: string | null
  builder: Tag | null
  slots: SlotView[]
  /** Check slots: only for items needed more than once. */
  checks: { done: number; required: number } | null
}

export type BoardView = {
  seasonName: string
  seasonIcon: string
  cards: CardView[]
  /** How many items wait behind the visible cards. */
  hiddenCount: number
  /** Who's cooking right now (shown to everyone). */
  cooks: Tag[]
}

function tagOf(state: GameState, playerId: PlayerId | null | undefined) {
  if (playerId == null) return null
  const player = findPlayer(state, playerId)
  if (!player) return null
  const character = CHARACTERS.find((c) => c.id === player.characterId)
  return {
    playerId,
    label: character?.tag ?? '?',
    color: player.color,
  } satisfies Tag
}

/** A player as listed in setup and the switcher: tag + character name. */
export type PlayerEntry = Tag & { name: string }

/** Every player, in joining order (for the switcher and setup). */
export function playerTags(state: GameState): PlayerEntry[] {
  return state.players.map((p) => ({
    ...(tagOf(state, p.id) as Tag),
    name: CHARACTERS.find((c) => c.id === p.characterId)?.name ?? '?',
  }))
}

export function cardView(state: GameState, itemId: ItemId): CardView {
  const item = ITEMS[itemId]
  const card = cardOf(state, itemId)
  const required = requiredChecks(state, itemId)
  return {
    itemId,
    name: item.name,
    station: item.station === 'hand' ? null : STATIONS[item.station].name,
    builder: tagOf(state, card.builder),
    slots: item.ingredients.map((ing, slotIndex) => ({
      slotIndex,
      name: ing.name,
      amount: ing.amount,
      claimedBy: tagOf(state, card.claims[slotIndex]),
    })),
    checks: required > 1 ? { done: card.checks, required } : null,
  }
}

export function boardView(state: GameState, size?: number): BoardView {
  const visible = visibleBoard(state, size)
  return {
    seasonName: SEASON_NAMES[state.season],
    seasonIcon: SEASON_ICONS[state.season],
    cards: visible.map((id) => cardView(state, id)),
    hiddenCount: boardQueue(state).length - visible.length,
    cooks: cooks(state).map((p) => tagOf(state, p.id) as Tag),
  }
}

// ── My claims (M6) ──

export type MyClaimView = {
  itemId: ItemId
  name: string
  /** Where it's crafted, e.g. "Alchemy Engine". Null when made by hand. */
  station: string | null
  /** True if I'm the builder. */
  builder: boolean
  /** The ingredients I promised to bring for it. */
  slots: { slotIndex: number; name: string; amount: number }[]
}

export type MyClaimsView = {
  items: MyClaimView[]
  /** Every promise: one per ingredient slot + one per builder role. */
  count: number
}

/** "What did I promise?": board items first, then the rest. */
export function myClaimsView(
  state: GameState,
  playerId: PlayerId,
): MyClaimsView {
  const items = myClaims(state, playerId).map((claim) => {
    const item = ITEMS[claim.itemId]
    return {
      itemId: claim.itemId,
      name: item.name,
      station: item.station === 'hand' ? null : STATIONS[item.station].name,
      builder: claim.builder,
      slots: claim.slots.map(({ slotIndex, ingredient }) => ({
        slotIndex,
        name: ingredient.name,
        amount: ingredient.amount,
      })),
    }
  })
  const count = items.reduce(
    (n, i) => n + i.slots.length + (i.builder ? 1 : 0),
    0,
  )
  return { items, count }
}

// ── Built list (M7) ──

export type BuiltItemView = { itemId: ItemId; name: string }

/** Everything built so far (long-press one to send it back to the board). */
export function builtListView(state: GameState): BuiltItemView[] {
  return builtItems(state).map((itemId) => ({
    itemId,
    name: ITEMS[itemId].name,
  }))
}
