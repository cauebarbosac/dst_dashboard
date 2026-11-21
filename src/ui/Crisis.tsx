// Crisis mode (M9): one tap on a crisis button starts it for everyone; a red
// banner shows each active crisis (latest on top), and one tap on a banner
// ends it. A mis-tap costs one more tap. The look (blinking, sounds) is
// decided later, in the visuals milestone.

import type { CrisisBanner, CrisisOption } from '../logic/view'

export function CrisisBanners({
  crises,
  onEnd,
}: {
  crises: CrisisBanner[]
  onEnd: (crisisId: string) => void
}) {
  if (crises.length === 0) return null
  return (
    <div className="crisis-banners" role="alert">
      {crises.map((c, i) => (
        <button
          key={c.id}
          type="button"
          className={i === 0 ? 'crisis-banner top' : 'crisis-banner'}
          onClick={() => onEnd(c.id)}
        >
          <span className="crisis-banner-name">
            <span aria-hidden="true">{c.icon}</span> {c.name}
          </span>
          <span className="crisis-banner-action">tap to end</span>
        </button>
      ))}
    </div>
  )
}

export function CrisisBar({
  options,
  onTrigger,
}: {
  options: CrisisOption[]
  onTrigger: (crisisId: string) => void
}) {
  return (
    <nav className="crisisbar" aria-label="Start a crisis">
      {options.map((c) => (
        <button
          key={c.id}
          type="button"
          className="crisis-button"
          aria-pressed={c.active}
          onClick={() => onTrigger(c.id)}
        >
          <span className="crisis-button-icon" aria-hidden="true">
            {c.icon}
          </span>
          <span className="crisis-button-name">{c.name}</span>
        </button>
      ))}
    </nav>
  )
}
