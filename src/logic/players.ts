import { CHARACTERS } from '../data/characters'
import { findPlayer, type GameState, type PlayerId } from './state'

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
