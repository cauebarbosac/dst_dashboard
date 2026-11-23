// Pictures from Firebase (M12): checking what came back before the UI
// uses it. The Firestore reads themselves are in firebaseRoom.ts.

import type { ArtMap } from '../logic/art'

const IMAGE_DATA_URL = /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/

/**
 * One group document → the pictures in it. Anything that isn't a picture
 * (or a missing document) is left out, so the UI falls back to text.
 */
export function parseArtDoc(raw: unknown): ArtMap {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw).filter(
      ([key, value]) =>
        /^[a-z0-9-]+$/.test(key) &&
        typeof value === 'string' &&
        IMAGE_DATA_URL.test(value),
    ),
  )
}

/** All groups together (a key is never in two groups; the last one wins). */
export function mergeArt(groups: unknown[]): ArtMap {
  return Object.assign({}, ...groups.map(parseArtDoc))
}
