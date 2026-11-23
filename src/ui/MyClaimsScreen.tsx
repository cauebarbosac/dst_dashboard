// My claims (M6): "what did I promise to bring?", readable at a glance.
// Tap a promise to release it. Released rows stay on screen, crossed out,
// until you leave, so a mis-tap is undone with one more tap.

import { useState, type ReactNode } from 'react'
import type { Action } from '../logic/actions'
import type { GameState, PlayerId } from '../logic/state'
import {
  boardView,
  cardView,
  myClaimsView,
  playerTags,
  type MyClaimView,
} from '../logic/view'
import { CookButton, CookStrip } from './Cooking'
import { ConnectionStrip, type Connection } from './ConnectionStrip'
import { CrisisBanners } from './Crisis'
import { PlayerTag } from './ItemCard'

type MyClaimsScreenProps = {
  state: GameState
  me: PlayerId
  connection: Connection
  dispatch: (action: Action) => void
  onBack: () => void
}

export function MyClaimsScreen({
  state,
  me,
  connection,
  dispatch,
  onBack,
}: MyClaimsScreenProps) {
  // The list as it was when the screen opened (so released rows stay).
  const [rows] = useState<MyClaimView[]>(() => myClaimsView(state, me).items)
  const live = myClaimsView(state, me)
  const myTag = playerTags(state).find((p) => p.playerId === me)
  const board = boardView(state)
  const cooks = board.cooks
  const amCooking = cooks.some((t) => t.playerId === me)

  const isMine = (itemId: MyClaimView['itemId'], slotIndex: number) =>
    cardView(state, itemId, me).slots[slotIndex]?.mine === true
  const amBuilder = (itemId: MyClaimView['itemId']) =>
    cardView(state, itemId).builder?.playerId === me

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="season-label">📋 My claims</h1>
        {myTag && <PlayerTag tag={myTag} />}
      </header>

      <CrisisBanners
        crises={board.crises}
        onEnd={(crisisId) => dispatch({ type: 'endCrisis', crisisId })}
      />
      <ConnectionStrip {...connection} />
      <CookStrip cooks={cooks} />

      <main className="claims">
        <p className="claims-summary">
          {live.count === 0
            ? 'Nothing promised right now.'
            : `${live.count} ${live.count === 1 ? 'promise' : 'promises'}`}
        </p>
        {rows.length === 0 && (
          <p className="setup-hint">
            Tap an ingredient on the board to promise to bring it.
          </p>
        )}

        {rows.map((item) => (
          <section key={item.itemId} className="claim-card">
            <h2 className="claim-item">
              {item.name}
              <span className="station">
                {item.station ? ` · ⚙ ${item.station}` : ' · ✋ By hand'}
              </span>
            </h2>

            {item.builder && (
              <ClaimRow
                active={amBuilder(item.itemId)}
                onTap={() =>
                  dispatch({
                    type: 'tapBuilder',
                    playerId: me,
                    itemId: item.itemId,
                  })
                }
              >
                <span className="claim-what">🔨 I build it</span>
              </ClaimRow>
            )}

            {item.slots.map((slot) => (
              <ClaimRow
                key={slot.slotIndex}
                active={isMine(item.itemId, slot.slotIndex)}
                onTap={() =>
                  dispatch({
                    type: 'tapSlot',
                    playerId: me,
                    itemId: item.itemId,
                    slotIndex: slot.slotIndex,
                  })
                }
              >
                <span className="claim-what">{slot.name}</span>
                <span className="slot-amount">×{slot.amount}</span>
              </ClaimRow>
            ))}
          </section>
        ))}
      </main>

      {/* Same dock as the board, so the thumb finds the same spots:
          left = switch screen (here: back to the board), right = cooking. */}
      <footer className="dock">
        <div className="actionbar">
          <button type="button" className="claims-button" onClick={onBack}>
            ← Board
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

/** One promise. Tap releases it; once released, tap takes it back. */
function ClaimRow({
  active,
  onTap,
  children,
}: {
  active: boolean
  onTap: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={active ? 'claim-row' : 'claim-row released'}
      onClick={onTap}
    >
      <span className="claim-main">{children}</span>
      <span className="claim-action">
        {active ? 'tap to release' : '↩ tap to take back'}
      </span>
    </button>
  )
}
