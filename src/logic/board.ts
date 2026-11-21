// Derived views: the UI asks these "what should I show?" and never works it
// out itself. Nothing here changes state.

import { CRISES } from '../data/crises'
import { ITEMS, type ItemId } from '../data/items'
import { SEASON_LISTS } from '../data/seasons'
import type { Crisis, Ingredient } from '../data/types'
import { cardOf, type GameState, type Player, type PlayerId } from './state'

/** How many cards are visible at once. To be tuned on the phone (3 or 4). */
export const BOARD_SIZE = 3

const ALL_ITEM_IDS = Object.keys(ITEMS) as ItemId[]

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function crisisById(id: string): Crisis | undefined {
  return CRISES.find((c) => c.id === id)
}

/**
 * Everything waiting on the board, in priority order:
 * 1. items of active crises, latest crisis first;
 * 2. then the current season's list;
 * built items skipped, each item listed once.
 */
export function boardQueue(state: GameState): ItemId[] {
  const crisisItems = [...state.activeCrises]
    .reverse()
    .flatMap((id) => (crisisById(id)?.items ?? []) as ItemId[])
  return unique([...crisisItems, ...SEASON_LISTS[state.season]]).filter(
    (id) => !cardOf(state, id).built,
  )
}

/** The top cards actually shown; the rest of the queue stays hidden. */
export function visibleBoard(
  state: GameState,
  size: number = BOARD_SIZE,
): ItemId[] {
  return boardQueue(state).slice(0, size)
}

/**
 * Items from earlier seasons that were never built and aren't on the board
 * now. They keep their claims and checks. If the season (or a crisis) lists
 * them again, they go back to the board.
 */
export function unfinishedItems(state: GameState): ItemId[] {
  const onBoard = new Set(boardQueue(state))
  return unique(
    state.seasonsSeen
      .filter((s) => s !== state.season)
      .flatMap((s) => SEASON_LISTS[s]),
  ).filter((id) => !onBoard.has(id) && !cardOf(state, id).built)
}

export function builtItems(state: GameState): ItemId[] {
  return ALL_ITEM_IDS.filter((id) => cardOf(state, id).built)
}

/** The crisis shown in the banner: the latest one triggered, if any. */
export function topCrisis(state: GameState): Crisis | undefined {
  const latest = state.activeCrises.at(-1)
  return latest === undefined ? undefined : crisisById(latest)
}

export function cooks(state: GameState): Player[] {
  return state.players.filter((p) => p.activity === 'cooking')
}

export type MyClaim = {
  itemId: ItemId
  /** True if I'm the builder of this item. */
  builder: boolean
  /** The ingredients I promised to bring for it. */
  slots: { slotIndex: number; ingredient: Ingredient }[]
}

/**
 * "What did I promise?": every item I'm building or bringing something for,
 * board first, then Unfinished business, then anything else.
 */
export function myClaims(state: GameState, playerId: PlayerId): MyClaim[] {
  const order = unique([
    ...boardQueue(state),
    ...unfinishedItems(state),
    ...ALL_ITEM_IDS,
  ])
  const result: MyClaim[] = []
  for (const itemId of order) {
    const card = cardOf(state, itemId)
    if (card.built) continue
    const slots = ITEMS[itemId].ingredients
      .map((ingredient, slotIndex) => ({ slotIndex, ingredient }))
      .filter(({ slotIndex }) => card.claims[slotIndex] === playerId)
    const builder = card.builder === playerId
    if (builder || slots.length > 0) result.push({ itemId, builder, slots })
  }
  return result
}
