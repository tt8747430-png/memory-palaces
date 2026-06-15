import type { Room, RoomStore } from '@/entities/room'

/** Read a room from the store's reactive state, or fail loudly. Edit/move commands
 * run against a started store, so the list is already hydrated. */
export function requireRoom(store: RoomStore, id: string): Room {
  const room = store.getState().rooms.find((candidate) => candidate.id === id)
  if (!room) throw new Error(`Room not found: ${id}`)
  return room
}
