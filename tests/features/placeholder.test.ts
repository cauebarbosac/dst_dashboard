import { describe, expect, it } from 'vitest'
import { boardTitle } from '../../src/logic/placeholder'

describe('boardTitle', () => {
  it('names the season', () => {
    expect(boardTitle('Winter')).toBe('Winter objectives')
  })
})
