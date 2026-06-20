import type { Palace, PalaceStore } from '@/entities/palace'
import { editPalace } from './edit-palace'

/** Command — file a palace into a folder, or unfile it with `null`. The folder is
 * just a grouping; this only changes the palace's `folderId`. */
export async function setPalaceFolder(
  store: PalaceStore,
  id: string,
  folderId: string | null,
): Promise<Palace> {
  return editPalace(store, id, { folderId })
}
