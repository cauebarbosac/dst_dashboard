import type { ItemId } from './items'
import type { Crisis } from './types'

// The first 4 crises. More (Deerclops, Overheating, Wildfire, Low sanity)
// come after we've tried these on the phone.
type CrisisData = Crisis & { items: ItemId[] }

export const CRISES: CrisisData[] = [
  {
    id: 'hound-wave',
    name: 'Hound wave',
    icon: '🐕',
    items: ['log-suit', 'football-helmet', 'tooth-trap'],
  },
  {
    id: 'freezing',
    name: 'Freezing',
    icon: '🥶',
    items: ['fire-pit', 'thermal-stone', 'winter-hat'],
  },
  {
    id: 'starvation',
    name: 'Starvation',
    icon: '🍖',
    items: ['crock-pot', 'drying-rack', 'bird-trap'],
  },
  {
    id: 'teammate-down',
    name: 'Teammate down',
    icon: '💉',
    items: [
      'telltale-heart',
      'booster-shot',
      'healing-salve',
      'honey-poultice',
    ],
  },
]
