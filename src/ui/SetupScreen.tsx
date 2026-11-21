// Players setup (M4): tap a character to add a player; colors are handed
// out automatically. Remove and "New game" need a second tap.

import { CHARACTERS } from '../data/characters'
import type { PlayerId } from '../logic/state'
import type { PlayerEntry } from '../logic/view'
import { ConfirmButton } from './ConfirmButton'
import { PlayerTag } from './ItemCard'

type SetupScreenProps = {
  players: PlayerEntry[]
  onAdd: (characterId: string) => void
  onRemove: (playerId: PlayerId) => void
  onNewGame: () => void
  onDone: () => void
}

export function SetupScreen({
  players,
  onAdd,
  onRemove,
  onNewGame,
  onDone,
}: SetupScreenProps) {
  return (
    <div className="app">
      <header className="topbar">
        <h1 className="season-label">👥 Players</h1>
      </header>

      <main className="setup">
        <section>
          <h2 className="setup-heading">Playing ({players.length})</h2>
          {players.length === 0 && (
            <p className="setup-hint">Nobody yet. Tap a character below.</p>
          )}
          <ul className="player-list">
            {players.map((p) => (
              <li key={p.playerId} className="player-row">
                <PlayerTag tag={p} />
                <span className="player-name">{p.name}</span>
                <ConfirmButton
                  className="remove-button"
                  ariaLabel={`Remove ${p.name}`}
                  armedLabel="Remove?"
                  onConfirm={() => onRemove(p.playerId)}
                >
                  ✕
                </ConfirmButton>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="setup-heading">Tap a character to add</h2>
          <div className="character-grid">
            {CHARACTERS.map((c) => (
              <button
                key={c.id}
                type="button"
                className="character-button"
                onClick={() => onAdd(c.id)}
              >
                <span className="character-tag">{c.tag}</span>
                <span className="character-name">{c.name}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <nav className="bottombar">
        <ConfirmButton
          className="secondary-button"
          armedLabel="Tap again: erase all"
          onConfirm={onNewGame}
        >
          New game
        </ConfirmButton>
        <button
          type="button"
          className="primary-button"
          disabled={players.length === 0}
          onClick={onDone}
        >
          To the board →
        </button>
      </nav>
    </div>
  )
}
