/// <reference types="node" />
// Live check of the shared room against the REAL Firebase project (M11).
// Two "phones" (two separate Firebase clients, each its own anonymous
// device) in one room. Skipped by `npm test`; run it on purpose with:
//   npm run test:live
// It creates a throwaway room each run (rooms can't be deleted by the app).

import { getApp } from 'firebase/app'
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { afterAll, describe, expect, it } from 'vitest'
import type { Action } from '../../src/logic/actions'
import { cardOf } from '../../src/logic/state'
import {
  createFirebaseRooms,
  type OpenRoom,
  type RoomView,
} from '../../src/storage/firebaseRoom'

const LIVE = process.env.LIVE_FIREBASE === '1'

/** One simulated phone: its client, id, open room and latest view. */
async function phone(name: string, summaryEvery = 100) {
  const rooms = createFirebaseRooms({ name, summaryEvery })
  const id = await rooms.deviceId()
  const views: RoomView[] = []
  let room: OpenRoom | null = null
  return {
    rooms,
    id,
    open(code: string) {
      room = rooms.openRoom(code, id, (v) => views.push(v))
    },
    send: (a: Action) => room!.send(a),
    close: () => room?.close(),
    last: () => views.at(-1),
    /** Waits until the latest view passes `check`; returns ms waited. */
    async until(check: (v: RoomView) => boolean, timeoutMs = 10_000) {
      const start = Date.now()
      while (Date.now() - start < timeoutMs) {
        const v = views.at(-1)
        if (v && check(v)) return Date.now() - start
        await new Promise((r) => setTimeout(r, 20))
      }
      throw new Error(`timed out; last view: ${JSON.stringify(views.at(-1))}`)
    },
  }
}

const claimed = (v: RoomView, slot = 0) =>
  cardOf(v.state, 'science-machine').claims[slot]
const tap = (playerId: string, slotIndex = 0): Action => ({
  type: 'tapSlot',
  playerId,
  itemId: 'science-machine',
  slotIndex,
})

describe.skipIf(!LIVE)('M11 live: two phones in one room', () => {
  const phones: Awaited<ReturnType<typeof phone>>[] = []
  afterAll(() => phones.forEach((p) => p.close()))

  it('create, join, and see each other’s taps within about a second', async () => {
    const ana = await phone('ana')
    const ben = await phone('ben')
    phones.push(ana, ben)
    expect(ana.id).not.toBe(ben.id)

    const code = await ana.rooms.createRoom()
    expect(code).toMatch(/^[A-Z]+-\d\d$/)
    ana.open(code)
    ben.open(code)
    await ana.until((v) => v.status === 'ready' && v.online)
    await ben.until((v) => v.status === 'ready' && v.online)

    ana.send({ type: 'joinRoom', playerId: ana.id, characterId: 'wilson' })
    ben.send({ type: 'joinRoom', playerId: ben.id, characterId: 'willow' })
    await ana.until((v) => v.state.players.length === 2)

    ana.send(tap(ana.id))
    // Instant on Ana's own screen…
    await ana.until((v) => claimed(v) === ana.id, 100)
    // …and on Ben's within about a second.
    const ms = await ben.until((v) => claimed(v) === ana.id)
    console.log(`Ben saw Ana's tap after ${ms} ms`)
    expect(ms).toBeLessThan(2000)

    ben.send({ type: 'toggleCooking', playerId: ben.id })
    await ana.until(
      (v) =>
        v.state.players.find((p) => p.id === ben.id)?.activity === 'cooking',
    )
    ;(globalThis as Record<string, unknown>).liveRoom = code
  }, 30_000)

  it('same slot tapped at the same moment: both phones agree on one winner', async () => {
    const [ana, ben] = phones
    ana.send(tap(ana.id, 1))
    ben.send(tap(ben.id, 1))
    await ana.until((v) => v.waiting === 0 && claimed(v, 1) !== undefined)
    await ben.until((v) => v.waiting === 0 && claimed(v, 1) !== undefined)
    await new Promise((r) => setTimeout(r, 1000))
    console.log(
      `slot 1 went to ${claimed(ana.last()!, 1) === ana.id ? 'Ana' : 'Ben'}`,
    )
    expect(claimed(ana.last()!, 1)).toBe(claimed(ben.last()!, 1))
  }, 30_000)

  it('Wi-Fi drops: taps show at once, marked offline, and arrive when it is back', async () => {
    const [ana, ben] = phones
    await ben.rooms.setOnline(false)
    await ben.until((v) => !v.online)

    ben.send(tap(ben.id, 2))
    await ben.until((v) => claimed(v, 2) === ben.id && v.waiting === 1, 200)
    await new Promise((r) => setTimeout(r, 1500))
    expect(claimed(ana.last()!, 2)).toBeUndefined() // not sent yet

    await ben.rooms.setOnline(true)
    const ms = await ana.until((v) => claimed(v, 2) === ben.id)
    await ben.until((v) => v.online && v.waiting === 0)
    console.log(`after reconnecting, Ana saw Ben's offline tap after ${ms} ms`)
  }, 30_000)

  it('summaries: a fresh phone loads the same board, and offline taps still show', async () => {
    const code = (globalThis as Record<string, unknown>).liveRoom as string
    const [ana] = phones
    // A phone that summarizes every 3 taps.
    const cy = await phone('cy', 3)
    phones.push(cy)
    cy.open(code)
    await cy.until((v) => v.status === 'ready' && v.online)
    cy.send({ type: 'joinRoom', playerId: cy.id, characterId: 'wendy' })
    for (const crisisId of ['freezing', 'hound-wave', 'freezing'])
      cy.send({ type: 'triggerCrisis', crisisId })
    await cy.until((v) => v.waiting === 0 && v.state.players.length === 3)
    await new Promise((r) => setTimeout(r, 1500)) // let the summary be written

    await ana.until(
      (v) => JSON.stringify(v.state) === JSON.stringify(cy.last()!.state),
    )

    // A new phone (no copy yet) loads summary + later taps = same board.
    const dee = await phone('dee')
    phones.push(dee)
    dee.open(code)
    await dee.until(
      (v) =>
        v.online &&
        JSON.stringify(v.state) === JSON.stringify(ana.last()!.state),
    )

    // Offline tap after a summary exists (the query filters on time):
    await cy.rooms.setOnline(false)
    cy.send({ type: 'endCrisis', crisisId: 'freezing' })
    await cy.until((v) => !v.state.activeCrises.includes('freezing'), 200)
    await cy.rooms.setOnline(true)
    await ana.until((v) => !v.state.activeCrises.includes('freezing'))
  }, 60_000)

  it('the server refuses cheating (fake time, someone else’s name, edits)', async () => {
    const code = (globalThis as Record<string, unknown>).liveRoom as string
    const [ana, ben] = phones
    const db = getFirestore(getApp('ana'))
    const actions = collection(db, 'rooms', code, 'actions')
    const action = { type: 'toggleCooking', playerId: ana.id }
    const refused = (p: Promise<unknown>) =>
      expect(p).rejects.toMatchObject({ code: 'permission-denied' })

    // Backdated time stamp, to "win" a slot.
    await refused(
      addDoc(actions, { action, by: ana.id, at: Timestamp.fromMillis(0) }),
    )
    // Tap signed as another phone.
    await refused(
      addDoc(actions, { action, by: ben.id, at: serverTimestamp() }),
    )
    // Extra fields.
    await refused(
      addDoc(actions, { action, by: ana.id, at: serverTimestamp(), x: 1 }),
    )
    // The log can't be edited or deleted.
    const real = await addDoc(actions, {
      action,
      by: ana.id,
      at: serverTimestamp(),
    })
    await refused(updateDoc(real, { 'action.type': 'newGame' }))
    await refused(deleteDoc(real))
    // No browsing the list of rooms.
    await refused(getDocs(collection(db, 'rooms')))
  }, 30_000)

  it('a code that does not exist shows as missing', async () => {
    const [ana] = phones
    const views: RoomView[] = []
    const r = ana.rooms.openRoom('ZZZZZZ-99', ana.id, (v) => views.push(v))
    const start = Date.now()
    while (views.at(-1)?.status !== 'missing' && Date.now() - start < 10_000)
      await new Promise((res) => setTimeout(res, 50))
    r.close()
    expect(views.at(-1)?.status).toBe('missing')
  }, 15_000)
})
