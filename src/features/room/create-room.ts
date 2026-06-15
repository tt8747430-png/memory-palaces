import { makeRoom, type Room, type RoomStore } from '@/entities/room'

export interface CreateRoomInput {
  title: string
  description?: string
}

/**
 * Command — add a room to a palace. The single write-path (UI + future Tutor). The
 * new room is appended: its order is the current room count for that palace.
 */
export async function createRoom(
  store: RoomStore,
  palaceId: string,
  input: CreateRoomInput,
): Promise<Room> {
  const order = store.getState().rooms.filter((room) => room.palaceId === palaceId).length
  const room = makeRoom({
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    palaceId,
    order,
  })
  await store.getState().save(room)
  return room
}
