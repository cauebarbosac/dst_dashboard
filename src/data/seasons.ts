import type { ItemId } from './items'
import type { Season } from './types'

/** Seasons in game order, starting from the first one. */
export const SEASON_ORDER: Season[] = ['autumn', 'winter', 'spring', 'summer']

export const SEASON_NAMES: Record<Season, string> = {
  autumn: 'Autumn',
  winter: 'Winter',
  spring: 'Spring',
  summer: 'Summer',
}

/** Each season's objectives, in priority order (first = most important). */
export const SEASON_LISTS: Record<Season, ItemId[]> = {
  autumn: [
    'science-machine',
    'alchemy-engine',
    'crock-pot',
    'ice-box',
    'backpack',
    'log-suit',
  ],
  winter: ['winter-hat', 'puffy-vest', 'thermal-stone', 'fire-pit'],
  spring: ['umbrella', 'rain-coat', 'lightning-rod'],
  summer: ['ice-flingomatic', 'endothermic-fire', 'floral-shirt'],
}
