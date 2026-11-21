// The board: season, item cards, and (single-phone phase) the player
// switcher. Taps are sent as actions; the rules decide what they mean.

import { SEASON_ICONS, SEASON_NAMES, SEASON_ORDER } from '../data/seasons'
import type { Action } from '../logic/actions'
import type { GameState, PlayerId } from '../logic/state'
import { boardView, playerTags } from '../logic/view'
import { ItemCard, PlayerTag } from './ItemCard'

type BoardScreenProps = {
  state: GameState
  me: PlayerId
  onSwitchPlayer: (playerId: PlayerId) => void
  onOpenSetup: () => void
  dispatch: (action: Action) => void
}

export function BoardScreen({
  state,
  me,
  onSwitchPlayer,
  onOpenSetup,
  dispatch,
}: BoardScreenProps) {
  const board = boardView(state)
  const players = playerTags(state)
  const amCooking = board.cooks.some((t) => t.playerId === me)

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="season-label">
          <span aria-hidden="true">{board.seasonIcon}</span> {board.seasonName}
        </h1>
        <button
          type="button"
          className="icon-button"
          aria-label="Players"
          onClick={onOpenSetup}
        >
          👥
        </button>
      </header>

      {/* Single-phone phase only: who is holding the phone right now.
          Goes away in M11, when each phone is one player. */}
      {players.length > 1 && (
        <div className="whoami" role="group" aria-label="You are">
          <span className="whoami-label">You:</span>
          {players.map((p) => (
            <button
              key={p.playerId}
              type="button"
              className="whoami-button"
              aria-pressed={me === p.playerId}
              aria-label={p.name}
              onClick={() => onSwitchPlayer(p.playerId)}
            >
              <PlayerTag tag={p} />
            </button>
          ))}
        </div>
      )}

      {/* Everyone sees who's cooking. Only who, not what: talk about the rest. */}
      {board.cooks.length > 0 && (
        <div className="cookstrip" role="status">
          <span aria-hidden="true">🍲</span>
          {board.cooks.map((t) => (
            <PlayerTag key={t.playerId} tag={t} />
          ))}
          <span>{board.cooks.length === 1 ? 'is cooking' : 'are cooking'}</span>
        </div>
      )}

      <main className="board">
        {board.cards.map((card) => (
          <ItemCard
            key={card.itemId}
            card={card}
            onTapBuilder={() =>
              dispatch({
                type: 'tapBuilder',
                playerId: me,
                itemId: card.itemId,
              })
            }
            onTapSlot={(slotIndex) =>
              dispatch({
                type: 'tapSlot',
                playerId: me,
                itemId: card.itemId,
                slotIndex,
              })
            }
          />
        ))}
        {board.cards.length === 0 && (
          <p className="board-empty">All done for this season 🎉</p>
        )}
        {board.hiddenCount > 0 && (
          <p className="board-more">+{board.hiddenCount} more waiting</p>
        )}
      </main>

      {/* Bottom dock = thumb reach: main actions, then the seasons. */}
      <footer className="dock">
        <div className="actionbar">
          <button
            type="button"
            className="cook-button"
            aria-pressed={amCooking}
            onClick={() => dispatch({ type: 'toggleCooking', playerId: me })}
          >
            {amCooking ? '🍲 Cooking… tap when done' : '🍲 I’m cooking'}
          </button>
        </div>

        {/* A preview control; the real one-tap season control comes in M8. */}
        <nav className="seasonbar" aria-label="Season">
          {SEASON_ORDER.map((season) => (
            <button
              key={season}
              type="button"
              className="season-button"
              aria-pressed={state.season === season}
              onClick={() => dispatch({ type: 'setSeason', season })}
            >
              <span aria-hidden="true">{SEASON_ICONS[season]}</span>
              {SEASON_NAMES[season]}
            </button>
          ))}
        </nav>
      </footer>
    </div>
  )
}
