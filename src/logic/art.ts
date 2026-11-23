// Images (M12): which picture belongs to which character, item or
// ingredient. Pure names only; the pictures themselves live in Firebase
// (src/storage/art.ts) and are never part of the app or the repo.
//
// A picture is found by its key: the name in lowercase with dashes.
//   characters → their id        ("wilson", "wx-78")
//   items and ingredients → name  ("Crock Pot" → "crock-pot",
//                                  "Cut Grass" → "cut-grass")

import { CHARACTERS } from '../data/characters'
import { ITEMS } from '../data/items'
import type { GameState, PlayerId } from './state'

/** Picture key → picture (a data: URL). Empty = text everywhere. */
export type ArtMap = Readonly<Record<string, string>>

/** The groups the pictures are stored in (one Firestore document each). */
export const ART_GROUPS = ['characters', 'items'] as const
export type ArtGroup = (typeof ART_GROUPS)[number]

/** "Cut Grass" → "cut-grass", "WX-78" → "wx-78", "Hound's Tooth" → "hounds-tooth". */
export function artKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '') // "Hound's Tooth" → "hounds-tooth"
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Extensions the upload accepts, with their image type. */
export const ART_TYPES: Readonly<Record<string, string>> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

/**
 * A downloaded file name → its key, or null if it isn't a picture.
 * Wiki suffixes and size prefixes are dropped: "Wilson_Portrait.webp" →
 * "wilson", "300px-Cut_Grass_Dropped.webp" → "cut-grass",
 * "Tooth_Trap_Build.webp" → "tooth-trap".
 */
export function fileArtKey(fileName: string): string | null {
  const match = /^(.+)\.([a-z0-9]+)$/i.exec(fileName)
  if (!match || !(match[2].toLowerCase() in ART_TYPES)) return null
  const base = match[1]
    .replace(/^\d+px-/i, '') // wiki thumbnail size: "300px-Rope.webp"
    .replace(/[_\s-]+(portrait|dropped|icon|build)$/i, '')
  return artKey(base) || null
}

/** Every key the game data can ask for, per group (sorted). */
export function neededArt(): Record<ArtGroup, string[]> {
  const items = new Set<string>()
  for (const item of Object.values(ITEMS)) {
    items.add(artKey(item.name))
    for (const ing of item.ingredients) items.add(artKey(ing.name))
  }
  return {
    characters: CHARACTERS.map((c) => c.id).sort(),
    items: [...items].sort(),
  }
}

/** The picture for a key, or null (then the UI shows text). */
export function artFor(art: ArtMap, key: string | null | undefined) {
  return (key && art[key]) || null
}

/** Player → picture key of their face (their character id). */
export function playerFaces(state: GameState): Record<PlayerId, string> {
  return Object.fromEntries(state.players.map((p) => [p.id, p.characterId]))
}

/** A Firestore document holds up to 1 MB; stay well under it. */
export const MAX_GROUP_BYTES = 900_000

export type ArtFile = { group: ArtGroup; fileName: string; base64: string }

export type ArtUpload = {
  /** What to write: group → { key → data URL }. */
  docs: Record<ArtGroup, Record<string, string>>
  /** Files whose name matches nothing in the game data (still uploaded). */
  unused: string[]
  /** Keys the game data needs that have no file yet. */
  missing: Record<ArtGroup, string[]>
  /** Files that aren't pictures, or a second file for the same key. */
  skipped: string[]
  /** Groups too big for one document (nothing should be written then). */
  tooBig: ArtGroup[]
}

/** Turns the files in private-assets/ into the documents to upload. */
export function packArt(files: ArtFile[]): ArtUpload {
  const needed = neededArt()
  const docs: ArtUpload['docs'] = { characters: {}, items: {} }
  const unused: string[] = []
  const skipped: string[] = []
  for (const { group, fileName, base64 } of [...files].sort((a, b) =>
    a.fileName < b.fileName ? -1 : 1,
  )) {
    const key = fileArtKey(fileName)
    if (!key || key in docs[group]) {
      skipped.push(fileName)
      continue
    }
    const ext = fileName.split('.').pop()!.toLowerCase()
    docs[group][key] = `data:${ART_TYPES[ext]};base64,${base64}`
    if (!needed[group].includes(key)) unused.push(fileName)
  }
  const missing = {
    characters: needed.characters.filter((k) => !(k in docs.characters)),
    items: needed.items.filter((k) => !(k in docs.items)),
  }
  const tooBig = ART_GROUPS.filter(
    (g) => JSON.stringify(docs[g]).length > MAX_GROUP_BYTES,
  )
  return { docs, unused, missing, skipped, tooBig }
}
