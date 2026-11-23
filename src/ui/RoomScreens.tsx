// Screens around the shared room (M11): create or join a room, waiting for
// it, and "who are you?" (pick your character when you join).

import { useState } from 'react'
import { CHARACTERS } from '../data/characters'
import type { PlayerEntry } from '../logic/view'
import { useCharacterFace } from './useArt'
import { PlayerTag } from './ItemCard'

/** The character buttons, shared by "Who are you?" and the Players screen. */
export function CharacterGrid({
  onPick,
  current,
}: {
  onPick: (characterId: string) => void
  current?: string
}) {
  return (
    <div className="character-grid">
      {CHARACTERS.map((c) => (
        <button
          key={c.id}
          type="button"
          className="character-button"
          aria-pressed={c.id === current}
          onClick={() => onPick(c.id)}
        >
          <CharacterFace id={c.id} tag={c.tag} />
          <span className="character-name">{c.name}</span>
        </button>
      ))}
    </div>
  )
}

/** The character's face (M12), or their short tag when there's no picture. */
function CharacterFace({ id, tag }: { id: string; tag: string }) {
  const face = useCharacterFace(id)
  return face ? (
    <img className="character-face" src={face} alt="" />
  ) : (
    <span className="character-tag">{tag}</span>
  )
}

/** No room yet: start one, or join friends with their code. */
export function RoomScreen({
  busy,
  error,
  onCreate,
  onJoin,
}: {
  busy: boolean
  error: string | null
  onCreate: () => void
  onJoin: (typed: string) => void
}) {
  const [typed, setTyped] = useState('')
  return (
    <div className="app">
      <header className="topbar">
        <h1 className="season-label">🔥 DST Board</h1>
      </header>
      <main className="setup">
        <section>
          <h2 className="setup-heading">New world</h2>
          <button
            type="button"
            className="primary-button room-button"
            disabled={busy}
            onClick={onCreate}
          >
            {busy ? 'Creating…' : 'Create a room'}
          </button>
          <p className="setup-hint">
            You get a code like MOOSE-42 to share with friends. Keep the same
            room for the whole world.
          </p>
        </section>

        <section>
          <h2 className="setup-heading">Join friends</h2>
          {/* A form, so the phone keyboard's "Go" key joins too. */}
          <form
            className="join-form"
            onSubmit={(e) => {
              e.preventDefault()
              onJoin(typed)
            }}
          >
            <input
              className="code-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="MOOSE-42"
              aria-label="Room code"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className="primary-button"
              disabled={typed.trim() === ''}
            >
              Join
            </button>
          </form>
          <p className="setup-hint">Or just open the invite link they sent.</p>
        </section>

        {error && (
          <p className="room-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  )
}

/** A full-screen message (connecting, no such room…) with optional buttons. */
export function StatusScreen({
  title,
  text,
  action,
  secondary,
}: {
  title: string
  text?: string
  action?: { label: string; onClick: () => void }
  secondary?: { label: string; onClick: () => void }
}) {
  return (
    <div className="app">
      <main className="status-screen">
        <h1 className="season-label">{title}</h1>
        {text && <p className="setup-hint">{text}</p>}
      </main>
      {(action || secondary) && (
        <nav className="bottombar">
          {secondary ? (
            <button
              type="button"
              className="secondary-button"
              onClick={secondary.onClick}
            >
              {secondary.label}
            </button>
          ) : (
            <span />
          )}
          {action && (
            <button
              type="button"
              className="primary-button"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          )}
        </nav>
      )}
    </div>
  )
}

/** In the room, but not playing yet: pick your character. */
export function JoinScreen({
  code,
  players,
  onPick,
  onLeave,
}: {
  code: string
  players: PlayerEntry[]
  onPick: (characterId: string) => void
  onLeave: () => void
}) {
  return (
    <div className="app">
      <header className="topbar">
        <h1 className="season-label">Who are you?</h1>
        <span className="room-code">{code}</span>
      </header>
      <main className="setup">
        {players.length > 0 && (
          <section>
            <h2 className="setup-heading">Already here</h2>
            <div className="player-chips">
              {players.map((p) => (
                <PlayerTag key={p.playerId} tag={p} />
              ))}
            </div>
          </section>
        )}
        <section>
          <h2 className="setup-heading">Tap your character</h2>
          <CharacterGrid onPick={onPick} />
        </section>
      </main>
      <nav className="bottombar">
        <button type="button" className="secondary-button" onClick={onLeave}>
          ← Other room
        </button>
        <span />
      </nav>
    </div>
  )
}
