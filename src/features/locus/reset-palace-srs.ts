import { roomsForPalace, type RoomStore, selectRooms } from '@/entities/room'
import { lociForRoom, type LocusStore, selectLoci } from '@/entities/locus'
import { resetLociSrs } from './reset-loci-srs'

/**
 * Command — clear the spaced-repetition schedule for every card in a palace, returning
 * the whole palace to "new" while keeping all content. Backs the palace-settings
 * "Reset progress" action; the per-room version is `resetRoomSrs`.
 */
export async function resetPalaceSrs(
  roomStore: RoomStore,
  locusStore: LocusStore,
  palaceId: string,
): Promise<void> {
  const rooms = roomsForPalace(selectRooms(roomStore.getState()), palaceId)
  const loci = selectLoci(locusStore.getState())
  const ids = rooms.flatMap((room) => lociForRoom(loci, room.id).map((locus) => locus.id))
  await resetLociSrs(locusStore, ids)
}
