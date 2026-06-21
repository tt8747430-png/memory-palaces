import { lociForRoom, selectLoci, type LocusStore } from '@/entities/locus'
import { resetLociSrs } from './reset-loci-srs'

/** Command — clear the spaced-repetition schedule of every locus in a room, returning
 * them all to "new". Backs the room hub's "Reset room progress" action. */
export async function resetRoomSrs(store: LocusStore, roomId: string): Promise<void> {
  const ids = lociForRoom(selectLoci(store.getState()), roomId).map((locus) => locus.id)
  await resetLociSrs(store, ids)
}
