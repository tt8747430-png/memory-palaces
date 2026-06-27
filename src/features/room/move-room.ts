import { type RoomStore, updateRoom } from '@/entities/room'
import { requireRoom } from './require-room'

export type MoveDirection = 'up' | 'down'

/**
 * Command — reorder a room one step within its palace by swapping `order` with its
 * neighbor. A no-op at the edges. This is the reorder primitive the up/down controls
 * use; a future drag gesture (@use-gesture) can reuse it or a list-level variant.
 */
export async function moveRoom(
  store: RoomStore,
  id: string,
  direction: MoveDirection,
): Promise<void> {
  const room = requireRoom(store, id)
  const siblings = store
    .getState()
    .rooms.filter((candidate) => candidate.palaceId === room.palaceId)
    .sort((a, b) => a.order - b.order)
  const index = siblings.findIndex((candidate) => candidate.id === id)
  const neighbor = siblings[direction === 'up' ? index - 1 : index + 1]
  if (!neighbor) return

  const now = new Date().toISOString()
  await store.getState().save(updateRoom(room, { order: neighbor.order }, now))
  await store.getState().save(updateRoom(neighbor, { order: room.order }, now))
}
