import { SEASON_ORDER } from '../data/seasons'
import type { Season } from '../data/types'
import type { GameState } from './state'

/**
 * One tap, by anyone. Unfinished items of earlier seasons are not moved
 * anywhere: Unfinished business is derived from `seasonsSeen` (see board.ts),
 * so they keep their claims and progress.
 */
export function setSeason(state: GameState, season: Season): GameState {
  if (!SEASON_ORDER.includes(season) || season === state.season) return state
  const seasonsSeen = state.seasonsSeen.includes(season)
    ? state.seasonsSeen
    : [...state.seasonsSeen, season]
  return { ...state, season, seasonsSeen }
}

/** The season after the current one (for a "next season" button). */
export function nextSeason(season: Season): Season {
  return SEASON_ORDER[(SEASON_ORDER.indexOf(season) + 1) % SEASON_ORDER.length]
}
