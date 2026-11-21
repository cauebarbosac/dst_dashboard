import { CRISES } from '../data/crises'
import type { GameState } from './state'

/**
 * One tap triggers a crisis for everyone. Several can be active; the latest
 * triggered takes the top of the board. Triggering an already-active crisis
 * moves it back to the top.
 */
export function triggerCrisis(state: GameState, crisisId: string): GameState {
  if (!CRISES.some((c) => c.id === crisisId)) return state
  return {
    ...state,
    activeCrises: [
      ...state.activeCrises.filter((id) => id !== crisisId),
      crisisId,
    ],
  }
}

/** One tap on the banner ends that crisis. */
export function endCrisis(state: GameState, crisisId: string): GameState {
  if (!state.activeCrises.includes(crisisId)) return state
  return {
    ...state,
    activeCrises: state.activeCrises.filter((id) => id !== crisisId),
  }
}
