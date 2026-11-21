import { describe, expect, it } from 'vitest'
import { SEASON_LISTS } from '../../src/data/seasons'
import {
  boardQueue,
  unfinishedItems,
  visibleBoard,
} from '../../src/logic/board'
import { markBuilt } from '../../src/logic/building'
import { claimSlot } from '../../src/logic/claims'
import { triggerCrisis } from '../../src/logic/crises'
import { nextSeason, setSeason } from '../../src/logic/seasons'
import { cardOf } from '../../src/logic/state'
import { gameWith } from './helpers'

describe('M2 seasons and Unfinished business', () => {
  it('changing season shows the new season list', () => {
    const game = setSeason(gameWith('wilson'), 'winter')
    expect(game.season).toBe('winter')
    expect(boardQueue(game)).toEqual(SEASON_LISTS.winter)
  })

  it('choosing the current season changes nothing', () => {
    const game = gameWith('wilson')
    expect(setSeason(game, 'autumn')).toBe(game)
  })

  it('unfinished items of the previous season move to Unfinished business', () => {
    let game = markBuilt(gameWith('wilson'), 'science-machine')
    game = setSeason(game, 'winter')
    expect(unfinishedItems(game)).toEqual([
      'alchemy-engine',
      'crock-pot',
      'ice-box',
      'backpack',
      'log-suit',
    ])
  })

  it('there is no Unfinished business in the first season', () => {
    expect(unfinishedItems(gameWith('wilson'))).toEqual([])
  })

  it('items in Unfinished business keep their claims and checks', () => {
    let game = gameWith('wilson', 'willow')
    game = claimSlot(game, 'p1', 'backpack', 0)
    game = markBuilt(game, 'backpack') // 1 of 2
    game = setSeason(game, 'winter')
    expect(unfinishedItems(game)).toContain('backpack')
    expect(cardOf(game, 'backpack')).toMatchObject({
      claims: { 0: 'p1' },
      checks: 1,
    })
  })

  it('built items never go to Unfinished business', () => {
    let game = markBuilt(gameWith('wilson'), 'crock-pot')
    game = setSeason(game, 'winter')
    expect(unfinishedItems(game)).not.toContain('crock-pot')
  })

  it('unfinished items pile up across several seasons, oldest first', () => {
    let game = setSeason(gameWith('wilson'), 'winter')
    game = setSeason(game, 'spring')
    const unfinished = unfinishedItems(game)
    expect(unfinished.slice(0, 6)).toEqual(SEASON_LISTS.autumn)
    expect(unfinished.slice(6)).toEqual(SEASON_LISTS.winter)
  })

  it('an unfinished item pulled up by a crisis shows on the board, not in Unfinished business', () => {
    let game = setSeason(gameWith('wilson'), 'winter')
    game = triggerCrisis(game, 'starvation') // includes Crock Pot (autumn)
    expect(visibleBoard(game)).toContain('crock-pot')
    expect(unfinishedItems(game)).not.toContain('crock-pot')
  })

  it('when the year comes back around, that season list is back on the board', () => {
    let game = setSeason(gameWith('wilson'), 'winter')
    game = setSeason(game, 'autumn')
    expect(boardQueue(game)).toEqual(SEASON_LISTS.autumn)
    expect(unfinishedItems(game)).toEqual(SEASON_LISTS.winter)
  })

  it('next season follows game order and wraps from summer to autumn', () => {
    expect(nextSeason('autumn')).toBe('winter')
    expect(nextSeason('summer')).toBe('autumn')
  })
})
