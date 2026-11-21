import { useReducer, useState } from 'react'
import { CHARACTERS } from './data/characters'
import { SEASON_ICONS, SEASON_NAMES, SEASON_ORDER } from './data/seasons'
import { applyAction } from './logic/actions'
import { claimBuilder, claimSlot } from './logic/claims'
import { addPlayer } from './logic/players'
import { createGame, type GameState, type PlayerId } from './logic/state'
import { boardView } from './logic/view'
import { ItemCard, PlayerTag } from './ui/ItemCard'

// TEMPORARY (until M4): a demo game with 2 players, one claim and one
// builder. Not saved: a reload starts over. Real players and saving
// arrive in M4.
function demoGame(): GameState {
  let game = ['wilson', 'willow'].reduce(addPlayer, createGame())
  game = claimSlot(game, 'p1', 'science-machine', 1)
  game = claimBuilder(game, 'p2', 'science-machine')
  return game
}

export default function App() {
  // useReducer: React keeps `state` and redraws the screen whenever
  // `dispatch(action)` produces a new one through applyAction.
  const [state, dispatch] = useReducer(applyAction, undefined, demoGame)
  // useState: a single value React remembers between redraws.
  // Which demo player is tapping (the M4 "player switcher", early).
  const [me, setMe] = useState<PlayerId>('p1')
  const board = boardView(state)

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="season-label">
          <span aria-hidden="true">{board.seasonIcon}</span> {board.seasonName}
        </h1>
        <div className="whoami" role="group" aria-label="You are">
          <span className="whoami-label">You:</span>
          {state.players.map((p) => (
            <button
              key={p.id}
              type="button"
              className="whoami-button"
              aria-pressed={me === p.id}
              onClick={() => setMe(p.id)}
            >
              <PlayerTag
                tag={{
                  label:
                    CHARACTERS.find((c) => c.id === p.characterId)?.tag ?? '?',
                  color: p.color,
                }}
              />
            </button>
          ))}
        </div>
      </header>

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

      {/* Bottom = thumb reach. A preview control; the real one-tap season
          control comes in M8. */}
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
    </div>
  )
}
