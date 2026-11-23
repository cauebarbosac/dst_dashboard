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

/** An emoji per season until the images milestone. */
export const SEASON_ICONS: Record<Season, string> = {
  autumn: '🍂',
  winter: '❄️',
  spring: '🌧️',
  summer: '☀️',
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
    'fire-pit', // moved from winter (2026-11-23)
    'bucket-o-poop', // added 2026-11-23
    'chest', // added 2026-11-23
  ],
  winter: ['winter-hat', 'puffy-vest', 'thermal-stone', 'beefalo-hat'], // Beefalo Hat added 2026-11-23
  spring: ['umbrella', 'rain-coat', 'lightning-rod', 'birdcage'], // Birdcage added 2026-11-23
  summer: [
    'ice-flingomatic',
    'endothermic-fire',
    'floral-shirt',
    'pretty-parasol',
  ], // Pretty Parasol added 2026-11-23
}
