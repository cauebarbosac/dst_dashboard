// One big item card. It draws a CardView and reports taps and holds; what
// they mean is decided in src/logic/. On the item itself: TAP = builder
// role, HOLD = built (one check for items needed N times).

import type { CSSProperties } from 'react'
import type { CardView, SlotView, Tag } from '../logic/view'
import { ItemPicture } from './art'
import { useFace } from './useArt'
import { HOLD_MS } from './holdToConfirm'
import { usePressOrHold } from './usePressOrHold'

/**
 * A player inside their color ring: their face when there's a picture
 * (M12), otherwise their name tag. The ring tells two Wilsons apart.
 */
export function PlayerTag({
  tag,
}: {
  tag: Pick<Tag, 'playerId' | 'label' | 'color'>
}) {
  const face = useFace(tag.playerId)
  return (
    <span
      className={face ? 'tag face' : 'tag'}
      style={{ '--ring': `var(--ring-${tag.color})` } as CSSProperties}
    >
      {face ? <img src={face} alt={tag.label} /> : tag.label}
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
        <ItemPicture name={card.name} className="card-picture" />
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
              className={slot.claimedBy.length > 0 ? 'slot claimed' : 'slot'}
              onClick={() => onTapSlot(slot.slotIndex)}
              aria-label={slotLabel(slot)}
            >
              <ItemPicture name={slot.name} className="slot-picture" />
              <span className="slot-name">{slot.name}</span>
              <span className="slot-amount">×{slot.amount}</span>
              {slot.claimedBy.length > 0 && (
                <span className="claimers">
                  {slot.claimedBy.map((tag) => (
                    <PlayerTag key={tag.playerId} tag={tag} />
                  ))}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {card.checks && <Checks {...card.checks} />}
    </article>
  )
}

/** What a screen reader says for a slot, and what a tap will do. */
function slotLabel(slot: SlotView): string {
  const what = `${slot.name} ×${slot.amount}`
  const who = slot.claimedBy.map((t) => t.label).join(' and ')
  if (slot.mine) return `${what}, claimed by ${who}. Tap to release yours`
  if (slot.full) return `${what}, claimed by ${who}`
  if (who) return `${what}, claimed by ${who}. Tap to help`
  return `${what}. Tap to claim`
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
