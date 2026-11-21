import { addPlayer } from '../../src/logic/players'
import { createGame, type GameState } from '../../src/logic/state'

/** A fresh autumn game with players p1, p2, … for the given characters. */
export function gameWith(...characterIds: string[]): GameState {
  return characterIds.reduce(addPlayer, createGame())
}

/** Applies the same step `times` times (e.g. several long presses). */
export function repeat(
  state: GameState,
  times: number,
  step: (s: GameState) => GameState,
): GameState {
  for (let i = 0; i < times; i++) state = step(state)
  return state
}
