import { describe, expect, it } from 'vitest'
import { CHARACTERS } from '../../src/data/characters'
import { CRISES } from '../../src/data/crises'
import { ITEMS } from '../../src/data/items'
import {
  SEASON_ICONS,
  SEASON_LISTS,
  SEASON_NAMES,
  SEASON_ORDER,
} from '../../src/data/seasons'
import { STATIONS } from '../../src/data/stations'
import type { Item } from '../../src/data/types'

const items: [string, Item][] = Object.entries(ITEMS)
const itemIds = new Set(Object.keys(ITEMS))

function duplicates(values: string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) !== i)
}

describe('M1 game data: items', () => {
  it('each item id matches the key it is stored under', () => {
    for (const [key, item] of items) expect(item.id).toBe(key)
  })

  it('item names are unique', () => {
    expect(duplicates(items.map(([, item]) => item.name))).toEqual([])
  })

  it('every item is crafted at a known station', () => {
    for (const [, item] of items) expect(STATIONS).toHaveProperty(item.station)
  })

  it('every item has at least one ingredient', () => {
    for (const [, item] of items)
      expect(item.ingredients.length).toBeGreaterThan(0)
  })

  it('ingredient amounts are positive whole numbers', () => {
    for (const [, item] of items) {
      for (const ing of item.ingredients) {
        expect(Number.isInteger(ing.amount) && ing.amount > 0).toBe(true)
      }
    }
  })

  it('an item never lists the same ingredient twice', () => {
    for (const [, item] of items) {
      expect(duplicates(item.ingredients.map((ing) => ing.name))).toEqual([])
    }
  })

  it('no item is an ingredient of itself', () => {
    for (const [, item] of items) {
      expect(item.ingredients.map((ing) => ing.name)).not.toContain(item.name)
    }
  })

  it('every item appears in at least one season or crisis list', () => {
    const used = new Set<string>([
      ...Object.values(SEASON_LISTS).flat(),
      ...CRISES.flatMap((c) => c.items),
    ])
    expect([...itemIds].filter((id) => !used.has(id))).toEqual([])
  })

  it('Booster Shot is a once-item (extra shots come back from the Built list)', () => {
    expect(ITEMS['booster-shot'].quantity).toBe('once')
  })
})

describe('M1 game data: stations', () => {
  it('each station id matches the key it is stored under', () => {
    for (const [key, station] of Object.entries(STATIONS))
      expect(station.id).toBe(key)
  })
})

describe('M1 game data: seasons', () => {
  it('has exactly the four seasons, in game order', () => {
    expect(SEASON_ORDER).toEqual(['autumn', 'winter', 'spring', 'summer'])
    expect(Object.keys(SEASON_LISTS).sort()).toEqual([...SEASON_ORDER].sort())
  })

  it('every season has at least one objective', () => {
    for (const season of SEASON_ORDER) {
      expect(SEASON_LISTS[season].length).toBeGreaterThan(0)
    }
  })

  it('every season list points to existing items', () => {
    for (const season of SEASON_ORDER) {
      for (const id of SEASON_LISTS[season]) expect(itemIds).toContain(id)
    }
  })

  it('no season list has duplicates', () => {
    for (const season of SEASON_ORDER) {
      expect(duplicates(SEASON_LISTS[season])).toEqual([])
    }
  })

  it('every season has a name and an icon (M3)', () => {
    for (const season of SEASON_ORDER) {
      expect(SEASON_NAMES[season].trim()).not.toBe('')
      expect(SEASON_ICONS[season].trim()).not.toBe('')
    }
  })
})

describe('M1 game data: crises', () => {
  it('starts with the four agreed crises', () => {
    expect(CRISES.map((c) => c.id)).toEqual([
      'hound-wave',
      'freezing',
      'starvation',
      'teammate-down',
    ])
  })

  it('crisis ids are unique', () => {
    expect(duplicates(CRISES.map((c) => c.id))).toEqual([])
  })

  it('every crisis has a name and an icon', () => {
    for (const crisis of CRISES) {
      expect(crisis.name.trim()).not.toBe('')
      expect(crisis.icon.trim()).not.toBe('')
    }
  })

  it('every crisis has at least one item', () => {
    for (const crisis of CRISES) expect(crisis.items.length).toBeGreaterThan(0)
  })

  it('every crisis list points to existing items', () => {
    for (const crisis of CRISES) {
      for (const id of crisis.items) expect(itemIds).toContain(id)
    }
  })

  it('no crisis list has duplicates', () => {
    for (const crisis of CRISES) expect(duplicates(crisis.items)).toEqual([])
  })
})

describe('M1 game data: characters', () => {
  it('character ids are unique', () => {
    expect(duplicates(CHARACTERS.map((c) => c.id))).toEqual([])
  })

  it('character names are unique', () => {
    expect(duplicates(CHARACTERS.map((c) => c.name))).toEqual([])
  })

  it('character tags are unique, so claims can be told apart', () => {
    expect(duplicates(CHARACTERS.map((c) => c.tag))).toEqual([])
  })

  it('tags are short (2–3 characters) and upper case', () => {
    for (const c of CHARACTERS) expect(c.tag).toMatch(/^[A-Z0-9]{2,3}$/)
  })
})
