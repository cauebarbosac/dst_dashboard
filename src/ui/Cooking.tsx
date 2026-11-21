// Who's cooking (M5), shared by the board and My claims so both screens
// behave the same: a strip everyone sees, and the "I'm cooking" toggle.

import type { Tag } from '../logic/view'
import { PlayerTag } from './ItemCard'

/** Shown under the header while anyone cooks. Only who, not what. */
export function CookStrip({ cooks }: { cooks: Tag[] }) {
  if (cooks.length === 0) return null
  return (
    <div className="cookstrip" role="status">
      <span aria-hidden="true">🍲</span>
      {cooks.map((t) => (
        <PlayerTag key={t.playerId} tag={t} />
      ))}
      <span>{cooks.length === 1 ? 'is cooking' : 'are cooking'}</span>
    </div>
  )
}

/** One tap: "I'm cooking". Another tap: done. */
export function CookButton({
  amCooking,
  onToggle,
}: {
  amCooking: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className="cook-button"
      aria-pressed={amCooking}
      onClick={onToggle}
    >
      {amCooking ? '🍲 Cooking… tap when done' : '🍲 I’m cooking'}
    </button>
  )
}
