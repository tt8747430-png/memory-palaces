import type { Locus, LocusStore } from '@/entities/locus'
import { createLocus } from '@/features/locus'
import type { TransferStrategy } from './model'

/** Command — parse text in the given format and create a locus per card in the room.
 * Reuses the single-locus write-path, so the same invariants apply. */
export async function importLoci(
  store: LocusStore,
  roomId: string,
  text: string,
  strategy: TransferStrategy,
): Promise<Locus[]> {
  const drafts = strategy.parse(text)
  const created: Locus[] = []
  for (const draft of drafts) {
    created.push(await createLocus(store, roomId, draft))
  }
  return created
}
