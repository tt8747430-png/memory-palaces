import { type LocusStore, updateLocus } from '@/entities/locus'

/**
 * Command — persist a manual card order within a room. Given the locus ids in their new
 * order, write each card's `order` to match its index. Only changed cards are saved, so a
 * no-op drag costs nothing. Used by the content editor's drag-to-reorder; the caller passes
 * the ids of one room's cards in their final order.
 */
export async function reorderLoci(store: LocusStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  const byId = new Map(store.getState().loci.map((locus) => [locus.id, locus]))
  await Promise.all(
    orderedIds.map((id, index) => {
      const locus = byId.get(id)
      if (!locus || locus.order === index) return undefined
      return store.getState().save(updateLocus(locus, { order: index }, now))
    }),
  )
}
