// One big item card. It draws a CardView and reports taps; what a tap
// means (claim / release / nothing) is decided in src/logic/claims.ts.
// The long press to build arrives in M7.

import type { CSSProperties } from 'react'
import type { CardView, Tag } from '../logic/view'

/** A player's name tag inside their color ring. */
export function PlayerTag({ tag }: { tag: Pick<Tag, 'label' | 'color'> }) {
  return (
    <span
      className="tag"
      style={{ '--ring': `var(--ring-${tag.color})` } as CSSProperties}
    >
      {tag.label}
    </span>
  )
}

type ItemCardProps = {
  card: CardView
  onTapBuilder: () => void
  onTapSlot: (slotIndex: number) => void
}

export function ItemCard({ card, onTapBuilder, onTapSlot }: ItemCardProps) {
  return (
    <article className="card">
      {/* The item itself = the builder slot. */}
      <button
        type="button"
        className="card-head"
        onClick={onTapBuilder}
        aria-label={`${card.name}: ${card.builder ? `built by ${card.builder.label}` : 'tap to be the builder'}`}
      >
        <span className="card-title">
          <span className="card-name">{card.name}</span>
          <span className="station">
            {card.station ? `⚙ ${card.station}` : '✋ By hand'}
          </span>
        </span>
        {card.builder ? (
          <PlayerTag tag={card.builder} />
        ) : (
          <span className="builder-empty">🔨</span>
        )}
      </button>

      <ul className="slots">
        {card.slots.map((slot) => (
          <li key={slot.slotIndex}>
            <button
              type="button"
              className={slot.claimedBy ? 'slot claimed' : 'slot'}
              onClick={() => onTapSlot(slot.slotIndex)}
            >
              <span className="slot-name">{slot.name}</span>
              <span className="slot-amount">×{slot.amount}</span>
              {slot.claimedBy && <PlayerTag tag={slot.claimedBy} />}
            </button>
          </li>
        ))}
      </ul>

      {card.checks && <Checks {...card.checks} />}
    </article>
  )
}

/** N check slots for items needed once per player. */
function Checks({ done, required }: { done: number; required: number }) {
  return (
    <div className="checks" aria-label={`${done} of ${required} built`}>
      {Array.from({ length: required }, (_, i) => (
        <span key={i} className={i < done ? 'check done' : 'check'}>
          {i < done ? '✓' : ''}
        </span>
      ))}
    </div>
  )
}
