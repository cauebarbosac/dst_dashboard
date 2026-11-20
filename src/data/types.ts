// Shapes of the hand-written game data (M1). Data only: no rules here.
// Game rules that use this data live in src/logic/.

export type Season = 'autumn' | 'winter' | 'spring' | 'summer'

/** Where an item is crafted. 'hand' = no station needed. */
export type StationId = 'hand' | 'science-machine' | 'alchemy-engine'

export type Station = {
  id: StationId
  name: string
}

/**
 * `once`: built once for the whole group (Science Machine, Crock Pot…).
 * `perPlayer`: one per player, N = number of players (Winter Hat…).
 */
export type QuantityType = 'once' | 'perPlayer'

/**
 * One ingredient slot on a card. A claim always covers the full amount;
 * `amount` is shown only so the claimer knows how much to bring.
 */
export type Ingredient = {
  name: string
  amount: number
}

export type Item = {
  id: string
  name: string
  station: StationId
  ingredients: Ingredient[]
  quantity: QuantityType
}

export type Crisis = {
  id: string
  name: string
  /** An emoji until the images milestone. */
  icon: string
  /** Item ids, in priority order. */
  items: string[]
}

export type Character = {
  id: string
  name: string
  /**
   * Short unique tag shown on claims until images arrive.
   * (Initials don't work: almost every name starts with W.)
   */
  tag: string
}
