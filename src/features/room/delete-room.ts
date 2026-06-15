import type { RoomStore } from '@/entities/room'

/** Command — delete a room. Idempotent (removing a missing room is a no-op). */
export async function deleteRoom(store: RoomStore, id: string): Promise<void> {
  await store.getState().remove(id)
}
