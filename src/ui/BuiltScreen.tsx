// The Built list (M7): everything built so far. Hold an item to send it
// back to the board (broken Thermal Stone, one more Booster Shot…).
// It comes back fresh: no claims, no checks.

import type { CSSProperties } from 'react'
import type { Action } from '../logic/actions'
import type { GameState } from '../logic/state'
import { builtListView, type BuiltItemView } from '../logic/view'
import { HOLD_MS } from './holdToConfirm'
import { usePressOrHold } from './usePressOrHold'

type BuiltScreenProps = {
  state: GameState
  dispatch: (action: Action) => void
  onBack: () => void
}

export function BuiltScreen({ state, dispatch, onBack }: BuiltScreenProps) {
  const built = builtListView(state)

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="season-label">✓ Built</h1>
      </header>

      <main className="claims">
        <p className="claims-summary">
          {built.length === 0
            ? 'Nothing built yet.'
            : 'Hold an item to send it back to the board.'}
        </p>
        {built.map((item) => (
          <BuiltRow
            key={item.itemId}
            item={item}
            onRestore={() =>
              dispatch({ type: 'restoreFromBuilt', itemId: item.itemId })
            }
          />
        ))}
      </main>

      <footer className="dock">
        <button type="button" className="primary-button" onClick={onBack}>
          ← Back to the board
        </button>
      </footer>
    </div>
  )
}

function BuiltRow({
  item,
  onRestore,
}: {
  item: BuiltItemView
  onRestore: () => void
}) {
  // No tap action here: only a hold does something.
  const press = usePressOrHold(null, onRestore)
  return (
    <button
      type="button"
      className={`claim-row hold-fill restore-fill ${press.holding ? 'holding' : ''}`}
      style={{ '--hold-ms': `${HOLD_MS}ms` } as CSSProperties}
      {...press.handlers}
    >
      <span className="claim-main">
        <span className="claim-what">✓ {item.name}</span>
      </span>
      <span className="claim-action">hold to send back</span>
    </button>
  )
}
