// Players screen. M4: one phone, tap a character to add a player.
// M11: each phone is one player in a shared room, so this screen shows the
// room code (and invite), who's playing, lets you change your own
// character, and has the room's big switches. Remove, "New world" and
// "Leave room" need a hold, so they can't happen by accident.

import { useState } from 'react'
import { roomLink } from '../logic/room'
import type { PlayerId } from '../logic/state'
import type { PlayerEntry } from '../logic/view'
import { ConfirmButton } from './ConfirmButton'
import { PlayerTag } from './ItemCard'
import { CharacterGrid } from './RoomScreens'

type SetupScreenProps = {
  roomCode: string
  players: PlayerEntry[]
  me: PlayerId
  myCharacter: string | undefined
  onPickCharacter: (characterId: string) => void
  onRemove: (playerId: PlayerId) => void
  onNewGame: () => void
  onLeave: () => void
  onDone: () => void
  keepAwake: boolean
  keepAwakeSupported: boolean
  onToggleKeepAwake: () => void
}

/** Opens the phone's share sheet (WhatsApp, Discord…), or copies the link. */
async function shareInvite(
  code: string,
): Promise<'shared' | 'copied' | 'failed'> {
  const url = roomLink(window.location.href, code)
  const text = `Join my DST board: room ${code}`
  try {
    if (navigator.share) {
      await navigator.share({ title: 'DST Board', text, url })
      return 'shared'
    }
    await navigator.clipboard.writeText(`${text} ${url}`)
    return 'copied'
  } catch {
    return 'failed' // closed the share sheet, or no clipboard
  }
}

export function SetupScreen({
  roomCode,
  players,
  me,
  myCharacter,
  onPickCharacter,
  onRemove,
  onNewGame,
  onLeave,
  onDone,
  keepAwake,
  keepAwakeSupported,
  onToggleKeepAwake,
}: SetupScreenProps) {
  const [shareNote, setShareNote] = useState<string | null>(null)
  const [changing, setChanging] = useState(false)

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="season-label">👥 Players</h1>
      </header>

      <main className="setup">
        <section>
          <h2 className="setup-heading">Room</h2>
          <div className="room-row">
            <span className="room-code room-code-big">{roomCode}</span>
            <button
              type="button"
              className="secondary-button share-button"
              onClick={async () => {
                const result = await shareInvite(roomCode)
                setShareNote(
                  result === 'copied'
                    ? 'Invite link copied'
                    : result === 'failed'
                      ? `Tell them the code: ${roomCode}`
                      : null,
                )
              }}
            >
              📨 Invite
            </button>
          </div>
          {shareNote && <p className="setup-hint">{shareNote}</p>}
        </section>

        <section>
          <h2 className="setup-heading">Playing ({players.length})</h2>
          <ul className="player-list">
            {players.map((p) => (
              <li key={p.playerId} className="player-row">
                <PlayerTag tag={p} />
                <span className="player-name">
                  {p.name}
                  {p.playerId === me && (
                    <span className="you-label"> (you)</span>
                  )}
                </span>
                {p.playerId === me ? (
                  <button
                    type="button"
                    className="secondary-button change-button"
                    aria-expanded={changing}
                    onClick={() => setChanging((open) => !open)}
                  >
                    Change
                  </button>
                ) : (
                  <ConfirmButton
                    className="remove-button"
                    ariaLabel={`Remove ${p.name}`}
                    armedLabel="Hold to remove"
                    onConfirm={() => onRemove(p.playerId)}
                  >
                    ✕
                  </ConfirmButton>
                )}
              </li>
            ))}
          </ul>
        </section>

        {changing && (
          <section>
            <h2 className="setup-heading">Tap your character</h2>
            <CharacterGrid
              current={myCharacter}
              onPick={(characterId) => {
                onPickCharacter(characterId)
                setChanging(false)
              }}
            />
          </section>
        )}

        {/* M10: a phone setting, not part of the game. */}
        <section>
          <h2 className="setup-heading">This phone</h2>
          <div className="setting-list">
            <button
              type="button"
              className="setting-row"
              role="switch"
              aria-checked={keepAwake}
              onClick={onToggleKeepAwake}
            >
              <span className="setting-label">
                💡 Keep screen awake
                {!keepAwakeSupported && (
                  <span className="setting-note">
                    Not available in this browser
                  </span>
                )}
              </span>
              <span className={`setting-state${keepAwake ? ' on' : ''}`}>
                {keepAwake ? 'On' : 'Off'}
              </span>
            </button>
            <ConfirmButton
              className="secondary-button leave-button"
              armedLabel="Hold to leave the room"
              onConfirm={onLeave}
            >
              🚪 Leave room
            </ConfirmButton>
          </div>
        </section>
      </main>

      <nav className="bottombar">
        <ConfirmButton
          className="secondary-button"
          armedLabel="Hold: erase for all"
          onConfirm={onNewGame}
        >
          New world
        </ConfirmButton>
        <button type="button" className="primary-button" onClick={onDone}>
          To the board →
        </button>
      </nav>
    </div>
  )
}
