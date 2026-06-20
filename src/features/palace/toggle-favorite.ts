import type { Palace, PalaceStore } from '@/entities/palace'
import { editPalace } from './edit-palace'
import { requirePalace } from './require-palace'

/** Command — flip a palace's favorite flag. A dedicated command (over a raw
 * `editPalace`) so the UI and the AI Tutor share one intent-named write-path. */
export async function togglePalaceFavorite(store: PalaceStore, id: string): Promise<Palace> {
  const palace = requirePalace(store, id)
  return editPalace(store, id, { favorite: !palace.favorite })
}
