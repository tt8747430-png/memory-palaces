import { lociForRoom, selectLoci, updateLocus, type LocusStore } from '@/entities/locus'
import { resequence } from '@/shared/lib'
import { requireLocus } from './require-locus'

export type MoveDirection = 'up' | 'down'

/**
 * Command — reorder a card one step within its room. Swaps with the adjacent card in the
 * displayed order, then resequences (0..n-1) so legacy/equal orders normalise on the
 * first move. A no-op at the edges; only the cards whose order changed are persisted.
 */
export async function moveLocus(
  store: LocusStore,
  id: string,
  direction: MoveDirection,
): Promise<void> {
  const locus = requireLocus(store, id)
  const ordered = lociForRoom(selectLoci(store.getState()), locus.roomId)
  const index = ordered.findIndex((candidate) => candidate.id === id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= ordered.length) return

  const next = [...ordered]
  ;[next[index], next[target]] = [next[target]!, next[index]!]

  const now = new Date().toISOString()
  await Promise.all(
    resequence(next).map(({ item, order }) =>
      store.getState().save(updateLocus(item, { order }, now)),
    ),
  )
}
