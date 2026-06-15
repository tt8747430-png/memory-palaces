import type { Room } from './types'
import type { RoomState } from './store'

export const selectRooms = (state: RoomState): Room[] => state.rooms
export const selectIsReady = (state: RoomState): boolean => state.status === 'ready'

/** Pure: the ordered rooms of one palace. Returns a new array, so compose it in a
 * component with `useMemo(() => roomsForPalace(rooms, palaceId), [rooms, palaceId])`. */
export const roomsForPalace = (rooms: Room[], palaceId: string): Room[] =>
  rooms.filter((room) => room.palaceId === palaceId).sort((a, b) => a.order - b.order)
