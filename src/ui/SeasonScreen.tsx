// Season picker (M8). Opened by tapping the season name on the board; one
// more tap picks the season. Two deliberate taps, so a stray tap mid-fight
// can't change the season, and a mistake is fixed the same way.

import type { Season } from '../data/types'
import type { GameState } from '../logic/state'
import { seasonOptions } from '../logic/view'

type SeasonScreenProps = {
  state: GameState
  onPick: (season: Season) => void
  onBack: () => void
}

export function SeasonScreen({ state, onPick, onBack }: SeasonScreenProps) {
  return (
    <div className="app">
      <header className="topbar">
        <h1 className="season-label">Season</h1>
      </header>

      <main className="claims">
        <p className="claims-summary">What season is it in the game?</p>
        <div className="season-grid">
          {seasonOptions(state).map((o) => (
            <button
              key={o.season}
              type="button"
              className="season-option"
              aria-pressed={o.current}
              onClick={() => onPick(o.season)}
            >
              <span className="season-option-icon" aria-hidden="true">
                {o.icon}
              </span>
              <span>{o.name}</span>
              {o.current && <span className="season-now">now</span>}
            </button>
          ))}
        </div>
        <p className="setup-hint">
          Items not built this season move to Unfinished business. They keep
          their claims.
        </p>
      </main>

      <footer className="dock">
        <button type="button" className="primary-button" onClick={onBack}>
          ← Back to the board
        </button>
      </footer>
    </div>
  )
}
