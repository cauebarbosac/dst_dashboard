import { describe, expect, it } from 'vitest'
import { CHARACTERS } from '../../src/data/characters'
import { ITEMS } from '../../src/data/items'
import {
  artFor,
  artKey,
  fileArtKey,
  MAX_GROUP_BYTES,
  neededArt,
  packArt,
  playerFaces,
  type ArtFile,
} from '../../src/logic/art'
import { mergeArt, parseArtDoc } from '../../src/storage/art'
import { gameWith } from './helpers'

// M12: pictures are found by key (name in lowercase with dashes).

describe('M12 picture keys', () => {
  it('names become lowercase-with-dashes keys', () => {
    expect(artKey('Crock Pot')).toBe('crock-pot')
    expect(artKey('Cut Grass')).toBe('cut-grass')
    expect(artKey('WX-78')).toBe('wx-78')
    expect(artKey("Hound's Tooth")).toBe('hounds-tooth')
    expect(artKey('Hound’s Tooth')).toBe('hounds-tooth')
    expect(artKey('  Winter  Koalefant Trunk ')).toBe('winter-koalefant-trunk')
  })

  it('every item key is its id (so the two never drift apart)', () => {
    for (const [id, item] of Object.entries(ITEMS))
      expect(artKey(item.name)).toBe(id)
  })

  it('every character key is its id', () => {
    for (const c of CHARACTERS) expect(artKey(c.id)).toBe(c.id)
  })

  it('needed keys: every character, item and ingredient, no duplicates', () => {
    const needed = neededArt()
    expect(needed.characters).toHaveLength(CHARACTERS.length)
    expect(needed.items).toContain('crock-pot')
    expect(needed.items).toContain('cut-grass') // an ingredient
    expect(new Set(needed.items).size).toBe(needed.items.length)
  })
})

describe('M12 file names from the wiki', () => {
  it('drops the wiki suffixes', () => {
    expect(fileArtKey('Wilson_Portrait.webp')).toBe('wilson')
    expect(fileArtKey('WX-78_Portrait.webp')).toBe('wx-78')
    expect(fileArtKey('Cut_Grass_Dropped.webp')).toBe('cut-grass')
    expect(fileArtKey('Crock_Pot.webp')).toBe('crock-pot')
    expect(fileArtKey("Hound's_Tooth.png")).toBe('hounds-tooth')
    expect(fileArtKey('Tooth_Trap_Build.webp')).toBe('tooth-trap')
  })

  it('drops the wiki thumbnail size prefix', () => {
    expect(fileArtKey('300px-Beefalo_Wool_Dropped.webp')).toBe('beefalo-wool')
    expect(fileArtKey('24px-Beefalo_Horn.webp')).toBe('beefalo-horn')
    // only a real "NNpx-" prefix, not digits that belong to the name
    expect(fileArtKey('WX-78_Portrait.webp')).toBe('wx-78')
    expect(fileArtKey('Rope_Icon.PNG')).toBe('rope')
  })

  it('ignores files that are not pictures', () => {
    expect(fileArtKey('notes.txt')).toBeNull()
    expect(fileArtKey('service-account.json')).toBeNull()
    expect(fileArtKey('noextension')).toBeNull()
    expect(fileArtKey('.webp')).toBeNull()
  })
})

describe('M12 packing the upload', () => {
  const file = (
    group: ArtFile['group'],
    fileName: string,
    base64 = 'AAAA',
  ): ArtFile => ({ group, fileName, base64 })

  it('groups pictures by key as data URLs', () => {
    const { docs } = packArt([
      file('characters', 'Wilson_Portrait.webp'),
      file('items', 'Rocks_Dropped.png', 'BBBB'),
    ])
    expect(docs.characters).toEqual({ wilson: 'data:image/webp;base64,AAAA' })
    expect(docs.items).toEqual({ rocks: 'data:image/png;base64,BBBB' })
  })

  it('lists what is still missing and what the data does not use', () => {
    const result = packArt([
      file('characters', 'Wilson_Portrait.webp'),
      file('characters', 'Wagstaff_Portrait.webp'),
    ])
    expect(result.missing.characters).not.toContain('wilson')
    expect(result.missing.characters).toContain('willow')
    expect(result.missing.items).toEqual(neededArt().items)
    expect(result.unused).toEqual(['Wagstaff_Portrait.webp'])
  })

  it('skips non-pictures and a second file for the same key', () => {
    const result = packArt([
      file('items', 'Rocks.webp', 'FIRST'),
      file('items', 'Rocks_Dropped.webp', 'SECOND'),
      file('items', 'readme.txt'),
    ])
    expect(Object.keys(result.docs.items)).toEqual(['rocks'])
    expect(result.skipped).toHaveLength(2)
  })

  it('flags a group too big for one document', () => {
    const huge = 'A'.repeat(MAX_GROUP_BYTES)
    expect(packArt([file('items', 'Rocks.webp', huge)]).tooBig).toEqual([
      'items',
    ])
    expect(packArt([file('items', 'Rocks.webp')]).tooBig).toEqual([])
  })
})

describe('M12 showing pictures', () => {
  it('a known key gives its picture; unknown or none gives null (text)', () => {
    const art = { wilson: 'data:x' }
    expect(artFor(art, 'wilson')).toBe('data:x')
    expect(artFor(art, 'willow')).toBeNull()
    expect(artFor(art, null)).toBeNull()
    expect(artFor({}, 'wilson')).toBeNull()
  })

  it('each player shows their character’s face', () => {
    expect(playerFaces(gameWith('wilson', 'wx-78'))).toEqual({
      p1: 'wilson',
      p2: 'wx-78',
    })
  })
})

describe('M12 pictures loaded from Firebase', () => {
  const pic = 'data:image/webp;base64,UklGR+/='

  it('keeps real pictures', () => {
    expect(parseArtDoc({ wilson: pic })).toEqual({ wilson: pic })
  })

  it('leaves out anything that is not a picture', () => {
    expect(
      parseArtDoc({
        wilson: 'javascript:alert(1)',
        willow: 42,
        'Bad Key': pic,
        wendy: 'data:text/html;base64,AAAA',
      }),
    ).toEqual({})
  })

  it('a missing or broken document gives no pictures (text everywhere)', () => {
    expect(parseArtDoc(undefined)).toEqual({})
    expect(parseArtDoc(null)).toEqual({})
    expect(parseArtDoc('nope')).toEqual({})
    expect(parseArtDoc([pic])).toEqual({})
  })

  it('merges the groups', () => {
    expect(mergeArt([{ wilson: pic }, undefined, { rocks: pic }])).toEqual({
      wilson: pic,
      rocks: pic,
    })
  })
})
