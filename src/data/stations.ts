import type { Station, StationId } from './types'

// The only stations an item can name. Add one here when a new item needs it.
export const STATIONS: Record<StationId, Station> = {
  hand: { id: 'hand', name: 'Hand' },
  'science-machine': { id: 'science-machine', name: 'Science Machine' },
  'alchemy-engine': { id: 'alchemy-engine', name: 'Alchemy Engine' },
}
