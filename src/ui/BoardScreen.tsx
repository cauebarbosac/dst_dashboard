// The board: season, item cards, crisis and cooking controls. Taps are
// sent as actions; the rules decide what they mean.
// (M11: the single-phone player switcher is gone; each phone is a player.)

import { useState } from 'react'
import type { Action } from '../logic/actions'
import type { GameState, PlayerId } from '../logic/state'
import {
  boardView,
  builtListView,
  crisisOptions,
  myClaimsView,
  type CardView,
} from '../logic/view'
import { CookButton, CookStrip } from './Cooking'
import { CrisisBanners, CrisisBar } from './Crisis'
import { ConnectionStrip, type Connection } from './ConnectionStrip'
import { ItemCard } from './ItemCard'

type BoardScreenProps = {
  state: GameState
  me: PlayerId
  connection: Connection
  onOpenSetup: () => void
  onOpenClaims: () => void
  onOpenBuilt: () => void
  onOpenSeason: () => void
  dispatch: (action: Action) => void
}

export function BoardScreen({
  state,
  me,
  connection,
  onOpenSetup,
  onOpenClaims,
  onOpenBuilt,
  onOpenSeason,
  dispatch,
}: BoardScreenProps) {
  const board = boardView(state)
  const amCooking = board.cooks.some((t) => t.playerId === me)
  const promises = myClaimsView(state, me).count
  const builtCount = builtListView(state).length
  // Unfinished business starts minimized; one tap opens it.
  const [showUnfinished, setShowUnfinished] = useState(false)

  const renderCard = (card: CardView) => (
    <ItemCard
      key={card.itemId}
      card={card}
      onTapBuilder={() =>
        dispatch({ type: 'tapBuilder', playerId: me, itemId: card.itemId })
      }
      onBuild={() => dispatch({ type: 'markBuilt', itemId: card.itemId })}
      onTapSlot={(slotIndex) =>
        dispatch({
          type: 'tapSlot',
          playerId: me,
          itemId: card.itemId,
          slotIndex,
        })
      }
    />
  )

  return (
    <div className="app">
      <header className="topbar">
        {/* The season control: tap to open the season picker. */}
        <button
          type="button"
          className="season-switch"
          aria-label={`Season: ${board.seasonName}. Tap to change`}
          onClick={onOpenSeason}
        >
          <span aria-hidden="true">{board.seasonIcon}</span> {board.seasonName}
          <span className="season-caret" aria-hidden="true">
            ▾
          </span>
        </button>
        <div className="topbar-buttons">
          <button
            type="button"
            className="icon-button built-button"
            aria-label={`Built list: ${builtCount}`}
            onClick={onOpenBuilt}
          >
            ✓ {builtCount}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Players"
            onClick={onOpenSetup}
          >
            👥
          </button>
        </div>
      </header>

      {/* Red banners, latest crisis on top. One tap ends that crisis. */}
      <CrisisBanners
        crises={board.crises}
        onEnd={(crisisId) => dispatch({ type: 'endCrisis', crisisId })}
      />

      <ConnectionStrip {...connection} />

      {/* Everyone sees who's cooking. Only who, not what. */}
      <CookStrip cooks={board.cooks} />

      <main className="board">
        {board.cards.map(renderCard)}
        {board.cards.length === 0 && (
          <p className="board-empty">All done for this season 🎉</p>
        )}
        {board.hiddenCount > 0 && (
          <p className="board-more">+{board.hiddenCount} more waiting</p>
        )}

        {board.unfinished.length > 0 && (
          <section className="unfinished">
            <button
              type="button"
              className="unfinished-toggle"
              aria-expanded={showUnfinished}
              onClick={() => setShowUnfinished((open) => !open)}
            >
              <span>📦 Unfinished business</span>
              <span className="claims-count">{board.unfinished.length}</span>
              <span className="season-caret" aria-hidden="true">
                {showUnfinished ? '▴' : '▾'}
              </span>
            </button>
            {showUnfinished && board.unfinished.map(renderCard)}
          </section>
        )}
      </main>

      {/* Bottom dock = thumb reach: the main actions. */}
      <footer className="dock">
        {/* One tap starts a crisis for everyone. */}
        <CrisisBar
          options={crisisOptions(state)}
          onTrigger={(crisisId) =>
            dispatch({ type: 'triggerCrisis', crisisId })
          }
        />
        <div className="actionbar">
          <button
            type="button"
            className="claims-button"
            onClick={onOpenClaims}
          >
            📋 My claims
            <span className="claims-count">{promises}</span>
          </button>
          <CookButton
            amCooking={amCooking}
            onToggle={() => dispatch({ type: 'toggleCooking', playerId: me })}
          />
        </div>
      </footer>
    </div>
  )
}
