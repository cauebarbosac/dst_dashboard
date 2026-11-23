import type { Item } from './types'

// Every item that can appear on the board. Recipes are the DST ones from
// dontstarve.wiki.gg (checked 2026-11-20). Ingredients are full stacks:
// one slot per ingredient, `amount` is shown for information only.
//
// `satisfies` checks each entry against the Item shape while keeping the
// exact keys, so `ItemId` below is the list of real ids and a typo in a
// season or crisis list fails the type check.
export const ITEMS = {
  // ── Base / stations ──
  'science-machine': {
    id: 'science-machine',
    name: 'Science Machine',
    station: 'hand',
    ingredients: [
      { name: 'Gold Nugget', amount: 1 },
      { name: 'Log', amount: 4 },
      { name: 'Rocks', amount: 4 },
    ],
    quantity: 'once',
  },
  'alchemy-engine': {
    id: 'alchemy-engine',
    name: 'Alchemy Engine',
    station: 'science-machine',
    ingredients: [
      { name: 'Boards', amount: 4 },
      { name: 'Cut Stone', amount: 2 },
      { name: 'Electrical Doodad', amount: 2 },
    ],
    quantity: 'once',
  },
  'crock-pot': {
    id: 'crock-pot',
    name: 'Crock Pot',
    station: 'science-machine',
    ingredients: [
      { name: 'Cut Stone', amount: 3 },
      { name: 'Charcoal', amount: 6 },
      { name: 'Twigs', amount: 6 },
    ],
    quantity: 'once',
  },
  'ice-box': {
    id: 'ice-box',
    name: 'Ice Box',
    station: 'alchemy-engine',
    ingredients: [
      { name: 'Gold Nugget', amount: 2 },
      { name: 'Gears', amount: 1 },
      { name: 'Cut Stone', amount: 1 },
    ],
    quantity: 'once',
  },
  'fire-pit': {
    id: 'fire-pit',
    name: 'Fire Pit',
    station: 'hand',
    ingredients: [
      { name: 'Log', amount: 2 },
      { name: 'Rocks', amount: 12 },
    ],
    quantity: 'once',
  },
  // Added 2026-11-23 (user request). DST recipe from dontstarve.wiki.gg.
  'bucket-o-poop': {
    id: 'bucket-o-poop',
    name: 'Bucket-o-poop',
    station: 'alchemy-engine',
    ingredients: [
      { name: 'Manure', amount: 3 },
      { name: 'Bone Shards', amount: 2 },
      { name: 'Log', amount: 4 },
    ],
    quantity: 'once',
  },
  // Added 2026-11-23 (user request). DST recipe from dontstarve.wiki.gg:
  // 240 winter insulation, the warm upgrade over the Winter Hat.
  'beefalo-hat': {
    id: 'beefalo-hat',
    name: 'Beefalo Hat',
    station: 'science-machine',
    ingredients: [
      { name: 'Beefalo Wool', amount: 8 },
      { name: 'Beefalo Horn', amount: 1 },
    ],
    quantity: 'perPlayer',
  },
  // Added 2026-11-23 (pictures uploaded by the user). DST recipes from
  // dontstarve.wiki.gg.
  chest: {
    id: 'chest',
    name: 'Chest',
    station: 'science-machine',
    ingredients: [{ name: 'Boards', amount: 3 }],
    quantity: 'once',
  },
  birdcage: {
    id: 'birdcage',
    name: 'Birdcage',
    station: 'alchemy-engine',
    ingredients: [
      { name: 'Papyrus', amount: 2 },
      { name: 'Gold Nugget', amount: 6 },
      { name: 'Seeds', amount: 2 },
    ],
    quantity: 'once',
  },
  // Cheap rain and heat cover: 50% wetness, 120 overheating protection.
  'pretty-parasol': {
    id: 'pretty-parasol',
    name: 'Pretty Parasol',
    station: 'hand',
    ingredients: [
      { name: 'Twigs', amount: 4 },
      { name: 'Cut Grass', amount: 3 },
      { name: 'Petals', amount: 6 },
    ],
    quantity: 'perPlayer',
  },
  'lightning-rod': {
    id: 'lightning-rod',
    name: 'Lightning Rod',
    station: 'science-machine',
    ingredients: [
      { name: 'Gold Nugget', amount: 4 },
      { name: 'Cut Stone', amount: 1 },
    ],
    quantity: 'once',
  },
  'ice-flingomatic': {
    id: 'ice-flingomatic',
    name: 'Ice Flingomatic',
    station: 'alchemy-engine',
    ingredients: [
      { name: 'Gears', amount: 2 },
      { name: 'Ice', amount: 15 },
      { name: 'Electrical Doodad', amount: 2 },
    ],
    quantity: 'once',
  },
  'endothermic-fire': {
    id: 'endothermic-fire',
    name: 'Endothermic Fire',
    station: 'science-machine',
    ingredients: [
      { name: 'Nitre', amount: 2 },
      { name: 'Cut Grass', amount: 3 },
    ],
    quantity: 'once',
  },

  // ── Personal gear (one per player) ──
  backpack: {
    id: 'backpack',
    name: 'Backpack',
    station: 'science-machine',
    ingredients: [
      { name: 'Cut Grass', amount: 4 },
      { name: 'Twigs', amount: 4 },
    ],
    quantity: 'perPlayer',
  },
  'log-suit': {
    id: 'log-suit',
    name: 'Log Suit',
    station: 'science-machine',
    ingredients: [
      { name: 'Log', amount: 8 },
      { name: 'Rope', amount: 2 },
    ],
    quantity: 'perPlayer',
  },
  'football-helmet': {
    id: 'football-helmet',
    name: 'Football Helmet',
    station: 'alchemy-engine',
    ingredients: [
      { name: 'Pig Skin', amount: 1 },
      { name: 'Rope', amount: 1 },
    ],
    quantity: 'perPlayer',
  },
  'winter-hat': {
    id: 'winter-hat',
    name: 'Winter Hat',
    station: 'alchemy-engine',
    ingredients: [
      { name: 'Beefalo Wool', amount: 4 },
      { name: 'Silk', amount: 4 },
    ],
    quantity: 'perPlayer',
  },
  'puffy-vest': {
    id: 'puffy-vest',
    name: 'Puffy Vest',
    station: 'alchemy-engine',
    ingredients: [
      { name: 'Winter Koalefant Trunk', amount: 1 },
      { name: 'Silk', amount: 8 },
      { name: 'Beefalo Wool', amount: 2 },
    ],
    quantity: 'perPlayer',
  },
  'thermal-stone': {
    id: 'thermal-stone',
    name: 'Thermal Stone',
    station: 'alchemy-engine',
    ingredients: [
      { name: 'Rocks', amount: 10 },
      { name: 'Pickaxe', amount: 1 },
      { name: 'Flint', amount: 3 },
    ],
    quantity: 'perPlayer',
  },
  umbrella: {
    id: 'umbrella',
    name: 'Umbrella',
    station: 'science-machine',
    ingredients: [
      { name: 'Twigs', amount: 6 },
      { name: 'Pig Skin', amount: 1 },
      { name: 'Silk', amount: 2 },
    ],
    quantity: 'perPlayer',
  },
  'rain-coat': {
    id: 'rain-coat',
    name: 'Rain Coat',
    station: 'science-machine',
    ingredients: [
      { name: 'Tentacle Spots', amount: 2 },
      { name: 'Rope', amount: 2 },
      { name: 'Bone Shards', amount: 2 },
    ],
    quantity: 'perPlayer',
  },
  'floral-shirt': {
    id: 'floral-shirt',
    name: 'Floral Shirt',
    station: 'alchemy-engine',
    ingredients: [
      { name: 'Papyrus', amount: 3 },
      { name: 'Silk', amount: 3 },
      { name: 'Cactus Flower', amount: 5 },
    ],
    quantity: 'perPlayer',
  },

  // ── Traps & food ──
  'tooth-trap': {
    id: 'tooth-trap',
    name: 'Tooth Trap',
    station: 'alchemy-engine',
    ingredients: [
      { name: 'Log', amount: 1 },
      { name: 'Rope', amount: 1 },
      { name: "Hound's Tooth", amount: 1 },
    ],
    quantity: 'once',
  },
  'drying-rack': {
    id: 'drying-rack',
    name: 'Drying Rack',
    station: 'science-machine',
    ingredients: [
      { name: 'Twigs', amount: 3 },
      { name: 'Charcoal', amount: 2 },
      { name: 'Rope', amount: 3 },
    ],
    quantity: 'once',
  },
  'bird-trap': {
    id: 'bird-trap',
    name: 'Bird Trap',
    station: 'science-machine',
    ingredients: [
      { name: 'Twigs', amount: 3 },
      { name: 'Silk', amount: 4 },
    ],
    quantity: 'once',
  },

  // ── Healing & revive ──
  'telltale-heart': {
    id: 'telltale-heart',
    name: 'Telltale Heart',
    // Crafting it also costs the crafter 40 Health (not modelled).
    station: 'hand',
    ingredients: [
      { name: 'Cut Grass', amount: 3 },
      { name: 'Spider Gland', amount: 1 },
    ],
    quantity: 'once',
  },
  'booster-shot': {
    id: 'booster-shot',
    name: 'Booster Shot',
    station: 'alchemy-engine',
    ingredients: [
      { name: 'Rot', amount: 8 },
      { name: 'Nitre', amount: 2 },
      { name: 'Stinger', amount: 1 },
    ],
    // One shot per revive, but `once` on purpose: extra shots come back
    // through the Built list ("a direction, not a counter").
    quantity: 'once',
  },
  'healing-salve': {
    id: 'healing-salve',
    name: 'Healing Salve',
    station: 'science-machine',
    ingredients: [
      { name: 'Ashes', amount: 2 },
      { name: 'Rocks', amount: 1 },
      { name: 'Spider Gland', amount: 1 },
    ],
    quantity: 'once',
  },
  'honey-poultice': {
    id: 'honey-poultice',
    name: 'Honey Poultice',
    station: 'alchemy-engine',
    ingredients: [
      { name: 'Papyrus', amount: 1 },
      { name: 'Honey', amount: 2 },
    ],
    quantity: 'once',
  },
} satisfies Record<string, Item>

export type ItemId = keyof typeof ITEMS
