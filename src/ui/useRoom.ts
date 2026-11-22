// The shared-room session for the app (M11): sign-in, which room this phone
// is in, and the live board. Screens get plain data and callbacks from it.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Action } from '../logic/actions'
import { normalizeRoomCode } from '../logic/room'
import type { PlayerId } from '../logic/state'
import {
  createFirebaseRooms,
  type OpenRoom,
  type RoomView,
  type Rooms,
} from '../storage/firebaseRoom'
import type { GameStore } from '../storage/store'

export type RoomSession =
  | { phase: 'signing-in'; failed: boolean; retry: () => void }
  | {
      phase: 'no-room'
      busy: boolean
      error: string | null
      create: () => void
      join: (typed: string) => void
    }
  | {
      phase: 'room'
      code: string
      deviceId: PlayerId
      view: RoomView | null
      send: (action: Action) => void
      leave: () => void
    }

// Firebase starts on first use only (not when a test imports this file).
let rooms: Rooms | null = null
const getRooms = () => (rooms ??= createFirebaseRooms())

/** A room code from an invite link (…#room=MOOSE-42), then removed from the address bar. */
function codeFromLink(): string | null {
  const code = normalizeRoomCode(window.location.hash)
  if (code) history.replaceState(null, '', window.location.pathname)
  return code
}

export function useRoom(store: GameStore): RoomSession {
  const [deviceId, setDeviceId] = useState<PlayerId | null>(null)
  const [signInFailed, setSignInFailed] = useState(false)
  const [code, setCode] = useState<string | null>(
    () => codeFromLink() ?? store.loadRoom(),
  )
  // The latest view, tagged with its room, so a view of the previous room
  // is never shown for the new one.
  const [latest, setLatest] = useState<{ code: string; view: RoomView } | null>(
    null,
  )
  const view = latest && latest.code === code ? latest.view : null
  // useRef: a value kept between redraws that doesn't cause one (like an
  // instance attribute). Holds the open room, to send taps through.
  const openRoom = useRef<OpenRoom | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = useCallback(() => {
    getRooms()
      .deviceId()
      .then(setDeviceId, () => setSignInFailed(true))
  }, [])
  useEffect(signIn, [signIn])

  useEffect(() => store.saveRoom(code), [store, code])

  // Opening a link while already in the app (e.g. pasted in the browser).
  useEffect(() => {
    const onHash = () => {
      const linked = codeFromLink()
      if (linked) setCode(linked)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Listen to the room while we're in one.
  useEffect(() => {
    if (!deviceId || !code) return
    const room = getRooms().openRoom(code, deviceId, (v) =>
      setLatest({ code, view: v }),
    )
    openRoom.current = room
    return () => {
      room.close()
      openRoom.current = null
    }
  }, [deviceId, code])

  if (!deviceId)
    return {
      phase: 'signing-in',
      failed: signInFailed,
      retry() {
        setSignInFailed(false)
        signIn()
      },
    }

  if (!code)
    return {
      phase: 'no-room',
      busy,
      error,
      create() {
        setBusy(true)
        setError(null)
        getRooms()
          .createRoom()
          .then(setCode, () =>
            setError(
              'Could not create a room. Check the connection and try again.',
            ),
          )
          .finally(() => setBusy(false))
      },
      join(typed) {
        const normalized = normalizeRoomCode(typed)
        if (normalized) {
          setError(null)
          setCode(normalized)
        } else setError('That doesn’t look like a room code (like MOOSE-42).')
      },
    }

  return {
    phase: 'room',
    code,
    deviceId,
    view,
    send: (action) => openRoom.current?.send(action),
    leave: () => setCode(null),
  }
}
