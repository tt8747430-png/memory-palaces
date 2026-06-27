import { lociForRoom, type LocusStore, selectLoci } from '@/entities/locus'
import { markLociKnown } from './mark-loci-known'

/** Command — force every locus in a room into a "known" (mastered) schedule. Backs the
 * room hub's "Mark all as known" action ("I already know these"). */
export async function markRoomKnown(store: LocusStore, roomId: string): Promise<void> {
  const ids = lociForRoom(selectLoci(store.getState()), roomId).map((locus) => locus.id)
  await markLociKnown(store, ids)
}
