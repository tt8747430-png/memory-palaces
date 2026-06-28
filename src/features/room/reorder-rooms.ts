import { type RoomStore, updateRoom } from '@/entities/room'

/**
 * Command — persist a manual room order. Given the room ids in their new order, write each
 * room's `order` to match its index. Only changed rooms are saved, so a no-op drag costs
 * nothing. Used by the palace screen's drag-to-reorder; the caller passes the ids of one
 * palace's rooms in their final order.
 */
export async function reorderRooms(store: RoomStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  const byId = new Map(store.getState().rooms.map((room) => [room.id, room]))
  await Promise.all(
    orderedIds.map((id, index) => {
      const room = byId.get(id)
      if (!room || room.order === index) return undefined
      return store.getState().save(updateRoom(room, { order: index }, now))
    }),
  )
}
