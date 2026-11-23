// The picture of an item or ingredient (M12), drawn only when there is one.

import { useItemPicture } from './useArt'

/** An item or ingredient picture; draws nothing when there isn't one. */
export function ItemPicture({
  name,
  className,
}: {
  name: string
  className: string
}) {
  const src = useItemPicture(name)
  // alt="": the name is written right next to it, so readers skip it.
  return src ? <img className={className} src={src} alt="" /> : null
}
