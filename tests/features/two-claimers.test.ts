import { describe, expect, it } from 'vitest'
import { markBuilt } from '../../src/logic/building'
import {
  claimBuilder,
  claimersOf,
  claimSlot,
  MAX_CLAIMERS,
  releaseSlot,
  tapSlot,
} from '../../src/logic/claims'
import { removePlayer } from '../../src/logic/players'
import { cardOf, createGame } from '../../src/logic/state'
import { cardView, myClaimsView } from '../../src/logic/view'
import { parseGame } from '../../src/storage/store'
import { gameWith } from './helpers'

// M12a: up to two players can claim the same ingredient ("I'm helping" or
// "I'm near those"). Science Machine: slot 0 Gold Nugget, 1 Log, 2 Rocks.
const SM = 'science-machine'
const three = () => gameWith('wilson', 'willow', 'wendy')
const both = () => tapSlot(tapSlot(three(), 'p1', SM, 2), 'p2', SM, 2)

describe('M12a two claimers per ingredient', () => {
  it('a slot takes two claimers', () => {
    expect(MAX_CLAIMERS).toBe(2)
    expect(claimersOf(both(), SM, 2)).toEqual(['p1', 'p2'])
  })

  it('a third player cannot join a full slot', () => {
    const game = both()
    expect(claimSlot(game, 'p3', SM, 2)).toBe(game)
    expect(tapSlot(game, 'p3', SM, 2)).toBe(game)
  })

  it('joining twice changes nothing', () => {
    const game = tapSlot(three(), 'p1', SM, 2)
    expect(claimSlot(game, 'p1', SM, 2)).toBe(game)
  })

  it('the second claimer can release, leaving the first', () => {
    const game = tapSlot(both(), 'p2', SM, 2)
    expect(claimersOf(game, SM, 2)).toEqual(['p1'])
  })

  it('the first claimer can release, and the second stays', () => {
    const game = tapSlot(both(), 'p1', SM, 2)
    expect(claimersOf(game, SM, 2)).toEqual(['p2'])
  })

  it('when one leaves a full slot, a third player can join', () => {
    let game = tapSlot(both(), 'p1', SM, 2)
    game = tapSlot(game, 'p3', SM, 2)
    expect(claimersOf(game, SM, 2)).toEqual(['p2', 'p3'])
  })

  it('when both release, the slot is free again (no empty list left)', () => {
    let game = releaseSlot(both(), 'p1', SM, 2)
    game = releaseSlot(game, 'p2', SM, 2)
    expect(cardOf(game, SM).claims).toEqual({})
  })

  it('a non-claimer releasing changes nothing', () => {
    const game = both()
    expect(releaseSlot(game, 'p3', SM, 2)).toBe(game)
  })

  it('the builder role stays one player', () => {
    let game = claimBuilder(three(), 'p1', SM)
    game = claimBuilder(game, 'p2', SM)
    expect(cardOf(game, SM).builder).toBe('p1')
  })

  it('a built item still cannot be joined', () => {
    const game = markBuilt(tapSlot(three(), 'p1', SM, 2), SM)
    expect(tapSlot(game, 'p2', SM, 2)).toBe(game)
  })
})

describe('M12a my claims with a shared slot', () => {
  it('both claimers see it in My claims and in their count', () => {
    const game = both()
    for (const me of ['p1', 'p2']) {
      const view = myClaimsView(game, me)
      expect(view.count).toBe(1)
      expect(view.items[0].itemId).toBe(SM)
      expect(view.items[0].slots.map((s) => s.name)).toEqual(['Rocks'])
    }
    expect(myClaimsView(game, 'p3').count).toBe(0)
  })

  it('a player leaving frees only their spot', () => {
    const game = removePlayer(both(), 'p1')
    expect(claimersOf(game, SM, 2)).toEqual(['p2'])
  })

  it('a player leaving who was the only claimer frees the slot', () => {
    const game = removePlayer(tapSlot(three(), 'p1', SM, 2), 'p1')
    expect(cardOf(game, SM).claims).toEqual({})
  })
})

describe('M12a card view with two claimers', () => {
  it('shows both tags, first claimer first', () => {
    const slot = cardView(both(), SM).slots[2]
    expect(slot.claimedBy.map((t) => t.label)).toEqual(['WIL', 'WLO'])
  })

  it('tells me if I am in it and if it is full', () => {
    const one = tapSlot(three(), 'p1', SM, 2)
    expect(cardView(one, SM, 'p1').slots[2]).toMatchObject({
      mine: true,
      full: false,
    })
    expect(cardView(one, SM, 'p2').slots[2]).toMatchObject({
      mine: false,
      full: false,
    })
    expect(cardView(both(), SM, 'p3').slots[2]).toMatchObject({
      mine: false,
      full: true,
    })
  })

  it('a free slot: no tags, not mine, not full', () => {
    expect(cardView(three(), SM, 'p1').slots[0]).toMatchObject({
      claimedBy: [],
      mine: false,
      full: false,
    })
  })
})

describe('M12a loading saves from before two claimers', () => {
  const saved = (claims: unknown) => ({
    ...gameWith('wilson', 'willow'),
    cards: { [SM]: { builder: null, claims, checks: 0, built: false } },
  })
  const loadedClaims = (claims: unknown) =>
    parseGame(saved(claims))?.cards[SM]?.claims

  it('an old save (one id per slot) loads as a list of one', () => {
    expect(loadedClaims({ 0: 'p1', 2: 'p2' })).toEqual({
      0: ['p1'],
      2: ['p2'],
    })
  })

  it('a new save round-trips', () => {
    const game = tapSlot(
      tapSlot(gameWith('wilson', 'willow'), 'p1', SM, 0),
      'p2',
      SM,
      0,
    )
    expect(parseGame(JSON.parse(JSON.stringify(game)))).toEqual(game)
  })

  it('unknown players, duplicates and extras are dropped', () => {
    expect(loadedClaims({ 0: ['p9', 'p1', 'p1', 'p2', 'p3'] })).toEqual({
      0: ['p1', 'p2'],
    })
  })

  it('a slot left with nobody is dropped', () => {
    expect(loadedClaims({ 0: ['p9'], 1: [], 2: 42 })).toEqual({})
  })

  it('an empty game still loads', () => {
    expect(parseGame(createGame())).toEqual(createGame())
  })
})
