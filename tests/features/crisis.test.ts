import { describe, expect, it } from 'vitest'
import { SEASON_LISTS } from '../../src/data/seasons'
import { boardQueue, topCrisis, visibleBoard } from '../../src/logic/board'
import { markBuilt } from '../../src/logic/building'
import { endCrisis, triggerCrisis } from '../../src/logic/crises'
import { gameWith } from './helpers'

describe('M2 crisis mode', () => {
  it('no crisis at the start', () => {
    expect(topCrisis(gameWith('wilson'))).toBeUndefined()
  })

  it('triggering a crisis puts its items on top of the board, season items underneath', () => {
    const game = triggerCrisis(gameWith('wilson'), 'teammate-down')
    expect(visibleBoard(game)).toEqual([
      'telltale-heart',
      'booster-shot',
      'healing-salve',
    ])
    expect(boardQueue(game).slice(4)).toEqual(SEASON_LISTS.autumn)
    expect(topCrisis(game)?.id).toBe('teammate-down')
  })

  it('ending the crisis brings the board back to normal', () => {
    let game = triggerCrisis(gameWith('wilson'), 'teammate-down')
    game = endCrisis(game, 'teammate-down')
    expect(boardQueue(game)).toEqual(SEASON_LISTS.autumn)
    expect(topCrisis(game)).toBeUndefined()
  })

  it('with two crises, the latest one triggered takes the top', () => {
    let game = triggerCrisis(gameWith('wilson'), 'hound-wave')
    game = triggerCrisis(game, 'freezing')
    expect(visibleBoard(game)).toEqual([
      'fire-pit',
      'thermal-stone',
      'winter-hat',
    ])
    expect(boardQueue(game).slice(3, 6)).toEqual([
      'log-suit',
      'football-helmet',
      'tooth-trap',
    ])
    expect(topCrisis(game)?.id).toBe('freezing')
  })

  it('ending the latest crisis gives the top back to the earlier one', () => {
    let game = triggerCrisis(gameWith('wilson'), 'hound-wave')
    game = triggerCrisis(game, 'freezing')
    game = endCrisis(game, 'freezing')
    expect(topCrisis(game)?.id).toBe('hound-wave')
    expect(visibleBoard(game)).toEqual([
      'log-suit',
      'football-helmet',
      'tooth-trap',
    ])
  })

  it('triggering an already active crisis moves it back to the top', () => {
    let game = triggerCrisis(gameWith('wilson'), 'hound-wave')
    game = triggerCrisis(game, 'freezing')
    game = triggerCrisis(game, 'hound-wave')
    expect(game.activeCrises).toEqual(['freezing', 'hound-wave'])
  })

  it('an item in both a crisis and the season shows only once, at the crisis position', () => {
    const game = triggerCrisis(gameWith('wilson'), 'starvation')
    const queue = boardQueue(game)
    expect(queue[0]).toBe('crock-pot')
    expect(queue.filter((id) => id === 'crock-pot')).toHaveLength(1)
  })

  it('crisis items that are already built are skipped', () => {
    let game = markBuilt(gameWith('wilson'), 'telltale-heart')
    game = triggerCrisis(game, 'teammate-down')
    expect(visibleBoard(game)[0]).toBe('booster-shot')
  })

  it('an unknown crisis, or ending one that is not active, changes nothing', () => {
    const game = gameWith('wilson')
    expect(triggerCrisis(game, 'meteor-shower')).toBe(game)
    expect(endCrisis(game, 'freezing')).toBe(game)
  })
})
