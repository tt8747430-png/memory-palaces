import { type Room, type RoomChanges, type RoomStore, updateRoom } from '@/entities/room'
import { requireRoom } from './require-room'

/** Command — edit a room's title/description (and, internally, order). Runs through
 * the entity's invariant check and persists; the reactive store reflects the result. */
export async function editRoom(store: RoomStore, id: string, changes: RoomChanges): Promise<Room> {
  const existing = requireRoom(store, id)
  const updated = updateRoom(existing, changes, new Date().toISOString())
  await store.getState().save(updated)
  return updated
}
