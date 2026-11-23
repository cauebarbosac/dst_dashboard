// Pictures for the UI (M12). The App puts them in a React *context* once,
// and any component below reads them with `useArt()` instead of having
// them passed down through every screen. No pictures = text everywhere.

import { createContext, useContext } from 'react'
import { artFor, artKey, type ArtMap } from '../logic/art'
import type { PlayerId } from '../logic/state'

export type ArtContextValue = {
  art: ArtMap
  /** Player → their character id (the key of their face). */
  faces: Readonly<Record<PlayerId, string>>
}

export const ArtContext = createContext<ArtContextValue>({ art: {}, faces: {} })

export function useArt() {
  return useContext(ArtContext)
}

/** A player's face, or null (then the tag shows their initials). */
export function useFace(playerId: PlayerId): string | null {
  const { art, faces } = useArt()
  return artFor(art, faces[playerId])
}

/** A character's face by character id (e.g. in the character picker). */
export function useCharacterFace(characterId: string): string | null {
  return artFor(useArt().art, characterId)
}

/** An item's or ingredient's picture by its name, or null. */
export function useItemPicture(name: string): string | null {
  return artFor(useArt().art, artKey(name))
}
