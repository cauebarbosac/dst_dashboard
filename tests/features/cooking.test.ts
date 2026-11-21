import { describe, expect, it } from 'vitest'
import { cooks } from '../../src/logic/board'
import { toggleCooking } from '../../src/logic/players'
import { gameWith } from './helpers'

describe('M2 who is cooking', () => {
  it('nobody is cooking at the start', () => {
    expect(cooks(gameWith('wilson', 'willow'))).toEqual([])
  })

  it('one tap: I am cooking', () => {
    const game = toggleCooking(gameWith('wilson', 'willow'), 'p1')
    expect(cooks(game).map((p) => p.id)).toEqual(['p1'])
  })

  it('another tap: I am done', () => {
    let game = gameWith('wilson', 'willow')
    game = toggleCooking(toggleCooking(game, 'p1'), 'p1')
    expect(cooks(game)).toEqual([])
  })

  it('only changes that player', () => {
    const game = toggleCooking(gameWith('wilson', 'willow'), 'p2')
    expect(game.players.map((p) => p.activity)).toEqual(['none', 'cooking'])
  })

  it('several players can cook at once', () => {
    let game = gameWith('wilson', 'willow', 'warly')
    game = toggleCooking(toggleCooking(game, 'p1'), 'p3')
    expect(cooks(game).map((p) => p.id)).toEqual(['p1', 'p3'])
  })

  it('an unknown player is ignored', () => {
    const game = gameWith('wilson')
    expect(toggleCooking(game, 'p9')).toBe(game)
  })
})
