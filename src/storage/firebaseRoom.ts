// The shared room, stored in Firebase (M11). This replaces "saved on this
// phone" (store.ts) for the game itself; src/logic/ doesn't know or care.
//
// Firestore layout (rules: firestore.rules):
//   rooms/{CODE}               { version, summary (JSON of the board), upTo, createdAt }
//   rooms/{CODE}/actions/{id}  { action, by (device id), at (server time) }
// The board = the summary + every action stamped after `upTo`, replayed in
// server order (see src/logic/room.ts).
//
// Offline: Firestore keeps a copy of the room on the phone and queues new
// taps; they're sent when the connection is back. The app doesn't have to
// do anything special for that.

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import {
  addDoc,
  collection,
  disableNetwork,
  doc,
  enableNetwork,
  getDocFromServer,
  initializeFirestore,
  memoryLocalCache,
  onSnapshot,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { Action } from '../logic/actions'
import {
  makeRoomCode,
  nextSummary,
  replay,
  SUMMARY_EVERY,
  type LoggedAction,
} from '../logic/room'
import { createGame, type GameState, type PlayerId } from '../logic/state'
import { parseAction } from './actionCodec'
import { firebaseConfig } from './firebaseConfig'
import { parseGame } from './store'

export type RoomView = {
  /** loading = no copy on this phone yet; missing = no such room. */
  status: 'loading' | 'missing' | 'ready'
  state: GameState
  /** Connected and up to date with the server. */
  online: boolean
  /** This phone's taps not yet received by the server. */
  waiting: number
}

export type OpenRoom = {
  send(action: Action): void
  close(): void
}

export type Rooms = {
  /** This phone's id (anonymous sign-in, remembered by the browser). */
  deviceId(): Promise<PlayerId>
  /** Makes a new, empty room and returns its code. Needs a connection. */
  createRoom(): Promise<string>
  openRoom(
    code: string,
    deviceId: PlayerId,
    onView: (view: RoomView) => void,
  ): OpenRoom
  /** For tests: pretend the Wi-Fi went away / came back. */
  setOnline(online: boolean): Promise<void>
}

/** Firestore time stamp ↔ microseconds (exact: the server stamps in µs). */
const toMicros = (t: Timestamp) =>
  t.seconds * 1_000_000 + Math.floor(t.nanoseconds / 1000)
const toTimestamp = (us: number) =>
  new Timestamp(Math.floor(us / 1_000_000), (us % 1_000_000) * 1000)

export function createFirebaseRooms({
  name,
  summaryEvery = SUMMARY_EVERY,
}: { name?: string; summaryEvery?: number } = {}): Rooms {
  const app: FirebaseApp = initializeApp(firebaseConfig, name)
  const auth = getAuth(app)
  const db: Firestore = initializeFirestore(app, {
    // On the phone, keep the room in the browser's database (IndexedDB) so
    // it opens offline. Node (tests) has none: keep it in memory.
    localCache:
      typeof indexedDB === 'undefined'
        ? memoryLocalCache()
        : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
  const roomRef = (code: string) => doc(db, 'rooms', code)

  return {
    async deviceId() {
      await auth.authStateReady()
      if (!auth.currentUser) await signInAnonymously(auth)
      return auth.currentUser!.uid
    },

    async createRoom() {
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = makeRoomCode()
        // From the server, not the phone's copy: is the code free?
        if ((await getDocFromServer(roomRef(code))).exists()) continue
        await setDoc(roomRef(code), {
          version: 1,
          summary: JSON.stringify(createGame()),
          upTo: null,
          createdAt: serverTimestamp(),
        })
        return code
      }
      throw new Error('no free room code found')
    },

    openRoom(code, deviceId, onView) {
      let base: GameState = createGame()
      let upTo: number | null = null
      let roomStatus: RoomView['status'] = 'loading'
      let roomFromCache = true
      /** Taps the server has (from the room's listener). */
      let confirmed: LoggedAction[] = []
      let logFromCache = true
      /** This phone's taps not yet on the server (from its own copy). */
      let mine: LoggedAction[] = []
      let stopActions: (() => void) | null = null
      let listeningFrom: number | null | undefined = undefined
      let summarizing = false

      function emit() {
        const online = !roomFromCache && !logFromCache
        const waiting = mine.length
        // Both lists can hold the same tap for a moment: keep it once.
        const ids = new Set(confirmed.map((e) => e.id))
        const log = [...confirmed, ...mine.filter((e) => !ids.has(e.id))]
        onView({
          status: roomStatus,
          state: replay(base, upTo, log),
          online,
          waiting,
        })
        const summary =
          roomStatus === 'ready' &&
          nextSummary(base, upTo, log, { online, waiting }, summaryEvery)
        if (summary && !summarizing) {
          summarizing = true
          void writeSummary(summary, upTo).finally(() => (summarizing = false))
        }
      }

      /** Only if nobody wrote a newer one meanwhile (checked on the server). */
      function writeSummary(
        summary: { state: GameState; upTo: number },
        basedOn: number | null,
      ) {
        return runTransaction(db, async (tx) => {
          const current = await tx.get(roomRef(code))
          const theirs = current.get('upTo') as Timestamp | null
          if ((theirs ? toMicros(theirs) : null) !== basedOn) return
          tx.update(roomRef(code), {
            summary: JSON.stringify(summary.state),
            upTo: toTimestamp(summary.upTo),
          })
        }).catch(() => {
          // offline or someone else won: the next tap tries again
        })
      }

      /** (Re)listen to the actions after the current summary. */
      function listenToActions() {
        if (listeningFrom === upTo) return
        stopActions?.()
        listeningFrom = upTo
        const actions = collection(db, 'rooms', code, 'actions')
        const q =
          upTo === null
            ? query(actions, orderBy('at'))
            : query(actions, where('at', '>', toTimestamp(upTo)), orderBy('at'))
        stopActions = onSnapshot(
          q,
          { includeMetadataChanges: true },
          (snap) => {
            confirmed = snap.docs.flatMap(toLogged)
            logFromCache = snap.metadata.fromCache
            emit()
          },
        )
      }

      // A tap made offline has no server time yet, so the "after the
      // summary" query above leaves it out on this phone. This second
      // listener only reads the phone's own copy (no server reads) and
      // picks up this phone's taps that are still on their way.
      const stopMine = onSnapshot(
        query(
          collection(db, 'rooms', code, 'actions'),
          where('by', '==', deviceId),
        ),
        { includeMetadataChanges: true, source: 'cache' },
        (snap) => {
          mine = snap.docs
            .filter((d) => d.metadata.hasPendingWrites)
            .flatMap(toLogged)
          emit()
        },
      )

      const stopRoom = onSnapshot(
        roomRef(code),
        { includeMetadataChanges: true },
        (snap) => {
          roomFromCache = snap.metadata.fromCache
          if (!snap.exists()) {
            // Not on this phone: "missing" only once the server says so.
            roomStatus = snap.metadata.fromCache ? 'loading' : 'missing'
            emit()
            return
          }
          const at = snap.get('upTo') as Timestamp | null
          upTo = at ? toMicros(at) : null
          base = readSummary(snap.get('summary'))
          roomStatus = 'ready'
          listenToActions()
          emit()
        },
        () => {
          // e.g. rules refused: treat as no such room
          roomStatus = 'missing'
          emit()
        },
      )

      return {
        send(action) {
          addDoc(collection(db, 'rooms', code, 'actions'), {
            action,
            by: deviceId,
            at: serverTimestamp(),
          }).catch(() => {
            // refused by the server: Firestore already undid it on screen
          })
        },
        close() {
          stopRoom()
          stopActions?.()
          stopMine()
        },
      }
    },

    setOnline: (online) => (online ? enableNetwork(db) : disableNetwork(db)),
  }
}

function readSummary(raw: unknown): GameState {
  try {
    return (
      (typeof raw === 'string' && parseGame(JSON.parse(raw))) || createGame()
    )
  } catch {
    return createGame()
  }
}

/** A log entry from Firestore, or nothing if it doesn't look right. */
function toLogged(d: QueryDocumentSnapshot): LoggedAction[] {
  const action = parseAction(d.get('action'))
  if (!action) return []
  // `at` is null while the tap is still on its way to the server;
  // "estimate" gives this phone's clock at send time instead.
  const at = d.get('at', { serverTimestamps: 'none' }) as Timestamp | null
  const estimate = d.get('at', {
    serverTimestamps: 'estimate',
  }) as Timestamp | null
  return [
    {
      id: d.id,
      action,
      at: at ? toMicros(at) : null,
      sentAt: estimate ? estimate.toMillis() : 0,
    },
  ]
}
