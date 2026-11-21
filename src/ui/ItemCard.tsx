// One big item card. It draws a CardView and reports taps and holds; what
// they mean is decided in src/logic/. On the item itself: TAP = builder
// role, HOLD = built (one check for items needed N times).

import type { CSSProperties } from 'react'
import type { CardView, Tag } from '../logic/view'
import { HOLD_MS } from './holdToConfirm'
import { usePressOrHold } from './usePressOrHold'

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
  onBuild: () => void
}

export function ItemCard({
  card,
  onTapBuilder,
  onTapSlot,
  onBuild,
}: ItemCardProps) {
  const press = usePressOrHold(onTapBuilder, onBuild)
  return (
    <article className={card.crisisIcon ? 'card crisis' : 'card'}>
      {/* The item itself = the builder slot (tap) and "built" (hold). */}
      <button
        type="button"
        className={`card-head hold-fill build-fill ${press.holding ? 'holding' : ''}`}
        style={{ '--hold-ms': `${HOLD_MS}ms` } as CSSProperties}
        {...press.handlers}
        aria-label={`${card.name}: tap to be the builder, hold to mark built`}
      >
        <span className="card-title">
          <span className="card-name">
            {card.crisisIcon && (
              <span aria-label="crisis item">{card.crisisIcon} </span>
            )}
            {card.name}
          </span>
          <span className="station">
            {card.station ? `⚙ ${card.station}` : '✋ By hand'}
            <span className="hold-hint"> · hold to build</span>
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
