import { describe, expect, it } from 'vitest'
import { markBuilt } from '../../src/logic/building'
import { claimBuilder, claimSlot } from '../../src/logic/claims'
import {
  addPlayer,
  pickCharacter,
  PLAYER_COLORS,
  removePlayer,
  resolveMe,
} from '../../src/logic/players'
import { cardOf, createGame } from '../../src/logic/state'
import { gameWith } from './helpers'

describe('M2 players', () => {
  it('a new game has no players and starts in autumn', () => {
    const game = createGame()
    expect(game.players).toEqual([])
    expect(game.season).toBe('autumn')
  })

  it('adding a player gives them an id, the character and a color ring', () => {
    const game = addPlayer(createGame(), 'wilson')
    expect(game.players).toEqual([
      { id: 'p1', characterId: 'wilson', color: 'red', activity: 'none' },
    ])
  })

  it('each new player gets the next free color', () => {
    const game = gameWith('wilson', 'willow', 'wendy')
    expect(game.players.map((p) => p.color)).toEqual(['red', 'blue', 'green'])
  })

  it('two players can pick the same character and are told apart by color', () => {
    const [a, b] = gameWith('wilson', 'wilson').players
    expect(a.characterId).toBe(b.characterId)
    expect(a.color).not.toBe(b.color)
    expect(a.id).not.toBe(b.id)
  })

  it('colors cycle once every color is taken', () => {
    const many = gameWith(...Array(PLAYER_COLORS.length + 1).fill('wes'))
    expect(many.players.at(-1)?.color).toBe(PLAYER_COLORS[0])
  })

  it('an unknown character is ignored', () => {
    const game = createGame()
    expect(addPlayer(game, 'not-a-character')).toBe(game)
  })

  it('a player can change character', () => {
    const game = pickCharacter(gameWith('wilson'), 'p1', 'wigfrid')
    expect(game.players[0].characterId).toBe('wigfrid')
    expect(game.players[0].color).toBe('red')
  })

  it('changing to an unknown character, or for an unknown player, does nothing', () => {
    const game = gameWith('wilson')
    expect(pickCharacter(game, 'p1', 'nobody')).toBe(game)
    expect(pickCharacter(game, 'p9', 'willow')).toBe(game)
  })
})

describe('M4 removing a player', () => {
  it('the player is gone', () => {
    const game = removePlayer(gameWith('wilson', 'willow'), 'p1')
    expect(game.players.map((p) => p.id)).toEqual(['p2'])
  })

  it('their claims and builder roles are released', () => {
    let game = gameWith('wilson', 'willow')
    game = claimSlot(game, 'p1', 'crock-pot', 0)
    game = claimSlot(game, 'p2', 'crock-pot', 1)
    game = claimBuilder(game, 'p1', 'crock-pot')
    game = removePlayer(game, 'p1')
    expect(cardOf(game, 'crock-pot')).toMatchObject({
      claims: { 1: ['p2'] },
      builder: null,
    })
  })

  it('N shrinks: a per-player item whose checks now reach N is built', () => {
    let game = gameWith('wilson', 'willow', 'wendy')
    game = markBuilt(markBuilt(game, 'backpack'), 'backpack') // 2 of 3
    game = removePlayer(game, 'p3')
    expect(cardOf(game, 'backpack').built).toBe(true)
  })

  it('a per-player item still short of the new N stays on the board', () => {
    let game = gameWith('wilson', 'willow', 'wendy')
    game = markBuilt(game, 'backpack') // 1 of 3
    game = removePlayer(game, 'p3') // now 1 of 2
    expect(cardOf(game, 'backpack')).toMatchObject({ checks: 1, built: false })
  })

  it('a new player never reuses an id still in the game', () => {
    let game = removePlayer(gameWith('wilson', 'willow'), 'p1')
    game = addPlayer(game, 'wendy')
    expect(game.players.map((p) => p.id)).toEqual(['p2', 'p3'])
  })

  it('the freed color is handed out again', () => {
    let game = removePlayer(gameWith('wilson', 'willow'), 'p1') // red freed
    game = addPlayer(game, 'wendy')
    expect(game.players.at(-1)?.color).toBe('red')
  })

  it('an unknown player is ignored', () => {
    const game = gameWith('wilson')
    expect(removePlayer(game, 'p9')).toBe(game)
  })
})

describe('M4 who am I on this device', () => {
  it('the remembered player, if still in the game', () => {
    expect(resolveMe(gameWith('wilson', 'willow'), 'p2')).toBe('p2')
  })

  it('falls back to the first player if the remembered one is gone', () => {
    expect(resolveMe(gameWith('wilson', 'willow'), 'p9')).toBe('p1')
    expect(resolveMe(gameWith('wilson'), null)).toBe('p1')
  })

  it('nobody when there are no players', () => {
    expect(resolveMe(createGame(), 'p1')).toBeNull()
  })
})
