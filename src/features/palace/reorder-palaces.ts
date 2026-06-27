import { type PalaceStore, updatePalace } from '@/entities/palace'

/**
 * Command — persist a manual palace order. Given the ids in their new order, write each
 * palace's `order` to match its index. Only changed palaces are saved, so a no-op drag
 * costs nothing. Used by the library's drag-to-reorder; the caller passes the ids of a
 * single container (a folder, or the root) in their final order.
 */
export async function reorderPalaces(store: PalaceStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  const byId = new Map(store.getState().palaces.map((palace) => [palace.id, palace]))
  await Promise.all(
    orderedIds.map((id, index) => {
      const palace = byId.get(id)
      if (!palace || palace.order === index) return undefined
      return store.getState().save(updatePalace(palace, { order: index }, now))
    }),
  )
}
