import type { Palace, PalaceStore } from '@/entities/palace'
import { editPalace } from './edit-palace'

/** Command — archive or restore a palace. Archived palaces leave the main list but
 * keep all their rooms, loci, and progress; restoring brings them straight back. */
export async function setPalaceArchived(
  store: PalaceStore,
  id: string,
  archived: boolean,
): Promise<Palace> {
  return editPalace(store, id, { archived })
}
