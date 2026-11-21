import { describe, expect, it } from 'vitest'
import {
  addPlayer,
  pickCharacter,
  PLAYER_COLORS,
} from '../../src/logic/players'
import { createGame } from '../../src/logic/state'
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
