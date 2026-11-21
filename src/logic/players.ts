import { CHARACTERS } from '../data/characters'
import type { ItemId } from '../data/items'
import { requiredChecks } from './building'
import { findPlayer, FRESH_CARD, type GameState, type PlayerId } from './state'

/** Ring colors, handed out in order. Exact shades get tuned with the visuals. */
export const PLAYER_COLORS = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
] as const

function isCharacter(characterId: string): boolean {
  return CHARACTERS.some((c) => c.id === characterId)
}

/** The first color nobody uses yet (cycles if every color is taken). */
function nextColor(state: GameState): string {
  const used = new Set(state.players.map((p) => p.color))
  const free = PLAYER_COLORS.find((c) => !used.has(c))
  return free ?? PLAYER_COLORS[state.players.length % PLAYER_COLORS.length]
}

function nextPlayerId(state: GameState): PlayerId {
  const numbers = state.players.map((p) => Number(p.id.slice(1)))
  return `p${Math.max(0, ...numbers) + 1}`
}

/** Adds a player with an automatic color ring. Two players may share a character. */
export function addPlayer(state: GameState, characterId: string): GameState {
  if (!isCharacter(characterId)) return state
  const player = {
    id: nextPlayerId(state),
    characterId,
    color: nextColor(state),
    activity: 'none' as const,
  }
  return { ...state, players: [...state.players, player] }
}

export function pickCharacter(
  state: GameState,
  playerId: PlayerId,
  characterId: string,
): GameState {
  if (!isCharacter(characterId) || !findPlayer(state, playerId)) return state
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, characterId } : p,
    ),
  }
}

/**
 * A player leaves (or was added by mistake). Their claims and builder
 * roles are released, so nothing stays promised by someone who's gone.
 * N shrinks with them: a per-player item whose checks now reach the new N
 * is built.
 */
export function removePlayer(state: GameState, playerId: PlayerId): GameState {
  if (!findPlayer(state, playerId)) return state
  const without: GameState = {
    ...state,
    players: state.players.filter((p) => p.id !== playerId),
  }
  const cards: GameState['cards'] = {}
  for (const [id, card] of Object.entries(state.cards)) {
    const itemId = id as ItemId
    if (!card) continue
    const claims = Object.fromEntries(
      Object.entries(card.claims).filter(([, who]) => who !== playerId),
    )
    const builder = card.builder === playerId ? null : card.builder
    const done =
      !card.built &&
      card.checks > 0 &&
      card.checks >= requiredChecks(without, itemId)
    cards[itemId] = done
      ? { ...FRESH_CARD, built: true }
      : { ...card, claims, builder }
  }
  return { ...without, cards }
}

/**
 * Who this device is. The remembered player if they're still in the game,
 * otherwise the first player, or nobody when there are no players.
 */
export function resolveMe(
  state: GameState,
  remembered: PlayerId | null,
): PlayerId | null {
  if (remembered !== null && findPlayer(state, remembered)) return remembered
  return state.players[0]?.id ?? null
}

/** One tap: "I'm cooking". Another tap: "I'm done". Only affects that player. */
export function toggleCooking(state: GameState, playerId: PlayerId): GameState {
  if (!findPlayer(state, playerId)) return state
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? { ...p, activity: p.activity === 'cooking' ? 'none' : 'cooking' }
        : p,
    ),
  }
}
