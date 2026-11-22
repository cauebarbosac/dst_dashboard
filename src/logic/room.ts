// Shared rooms (M11): room codes, and how every phone turns the room's
// list of taps into the same board.
//
// A room keeps a log of actions (taps), each stamped with the *server's*
// clock when it arrives. Every phone replays the log in that order with
// `applyAction`. So when two players tap the same slot, the one the server
// received first claims it, and the second tap finds it taken (no-op),
// on every phone alike. Nobody can fake the stamp: the database rules
// (firestore.rules) only accept the server's own time.
//
// Pure functions only: the Firebase side lives in src/storage/.

import { applyAction, type Action } from './actions'
import { findPlayer, type GameState, type PlayerId } from './state'

// ── Room codes ──────────────────────────────────────────────────────────

/** Words for room codes: DST creatures, short and easy to say out loud. */
export const ROOM_WORDS = [
  'HOUND',
  'SPIDER',
  'MOOSE',
  'KOALA',
  'BUNNY',
  'CROW',
  'FROG',
  'BEE',
  'PIG',
  'WALRUS',
  'MOLE',
  'BAT',
  'BEEFALO',
  'PENGUIN',
  'TALLBIRD',
  'GOBBLER',
] as const

/** A new code like `MOOSE-42`. `random` returns 0 ≤ x < 1 (Math.random). */
export function makeRoomCode(random: () => number = Math.random): string {
  const word = ROOM_WORDS[Math.floor(random() * ROOM_WORDS.length)]
  const number = Math.floor(random() * 100)
  return `${word}-${String(number).padStart(2, '0')}`
}

/**
 * Reads a code the way people type or paste it: `moose 42`, `Moose42`,
 * `MOOSE-42`, or a whole invite link (`…#room=MOOSE-42`).
 * Returns `MOOSE-42`, or null when it can't be a code.
 */
export function normalizeRoomCode(input: string): string | null {
  const fromLink = /room=([^&]*)/i.exec(input)
  const text = (fromLink ? decodeURIComponent(fromLink[1]) : input)
    .trim()
    .toUpperCase()
  const match = /^([A-Z]{2,10})[\s\-_.]*(\d{2})$/.exec(text)
  return match ? `${match[1]}-${match[2]}` : null
}

/** The invite link for a room (opening it joins the room). */
export function roomLink(appUrl: string, code: string): string {
  return `${appUrl.split('#')[0]}#room=${code}`
}

// ── The log ─────────────────────────────────────────────────────────────

/** One tap in a room's log. */
export type LoggedAction = {
  /** The log entry's id (random); breaks ties between equal stamps. */
  id: string
  action: Action
  /**
   * When the server received it, in microseconds since 1970, or null while
   * it's still on its way (sent from this phone, maybe offline).
   */
  at: number | null
  /** This phone's own clock when it was sent; orders the ones on their way. */
  sentAt: number
}

/** Server order: received first comes first; taps still on their way last. */
export function logOrder(a: LoggedAction, b: LoggedAction): number {
  const atA = a.at ?? Infinity
  const atB = b.at ?? Infinity
  if (atA !== atB) return atA < atB ? -1 : 1
  if (a.sentAt !== b.sentAt) return a.sentAt - b.sentAt
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/**
 * The board right now: the room's last summary (`base`, which covers every
 * tap stamped up to `upTo`) plus every later tap, in server order.
 * Taps from before `upTo` are already in the summary and are skipped, so
 * nothing is ever counted twice.
 */
export function replay(
  base: GameState,
  upTo: number | null,
  log: LoggedAction[],
): GameState {
  return log
    .filter((entry) => entry.at === null || upTo === null || entry.at > upTo)
    .sort(logOrder)
    .reduce((state, entry) => applyAction(state, entry.action), base)
}

/** After this many taps since the last summary, a phone writes a new one. */
export const SUMMARY_EVERY = 100

/**
 * Should this phone write a new summary of the room? Only when it has a
 * complete, confirmed view (online, nothing of its own still on its way),
 * and enough taps have piled up. Returns what to write, or null.
 * Keeps the room cheap: a phone opening the app reads the summary plus the
 * last few taps, not the whole playthrough.
 */
export function nextSummary(
  base: GameState,
  upTo: number | null,
  log: LoggedAction[],
  { online, waiting }: { online: boolean; waiting: number },
  every = SUMMARY_EVERY,
): { state: GameState; upTo: number } | null {
  if (!online || waiting > 0 || log.some((e) => e.at === null)) return null
  const newer = log.filter((e) => upTo === null || (e.at as number) > upTo)
  if (newer.length < every) return null
  const last = Math.max(...newer.map((e) => e.at as number))
  return { state: replay(base, upTo, newer), upTo: last }
}

// ── Who am I ────────────────────────────────────────────────────────────

/** This phone's player in the room, or null until it picks a character. */
export function myPlayer(
  state: GameState,
  deviceId: PlayerId | null,
): PlayerId | null {
  return deviceId !== null && findPlayer(state, deviceId) ? deviceId : null
}
