import type { Entity } from '@/shared/lib'

/**
 * A room is a place in a palace that holds loci (its own collection). Unlock,
 * completion, and progress are derived from its loci in `shared/lib/stats`, not
 * stored here.
 */
export interface Room extends Entity {
  palaceId: string
  title: string
  description: string
  /** Position within the palace; rooms unlock in this order. */
  order: number
}

export interface MakeRoomInput {
  id: string
  createdAt: string
  palaceId: string
  title: string
  description?: string
  order: number
}

export function makeRoom(input: MakeRoomInput): Room {
  const title = input.title.trim()
  if (!input.palaceId) throw new Error('Room must belong to a palace')
  if (!title) throw new Error('Room title is required')
  if (input.order < 0) throw new Error('Room order must be >= 0')
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    palaceId: input.palaceId,
    title,
    description: input.description?.trim() ?? '',
    order: input.order,
  }
}

/** Mutable fields of a room — identity, timestamps, and palace are owned elsewhere. */
export type RoomChanges = Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'palaceId'>>

/** Apply an edit, enforcing the same invariants as {@link makeRoom}. `updatedAt`
 * is set by the caller (clock injected) so the function stays pure. */
export function updateRoom(room: Room, changes: RoomChanges, updatedAt: string): Room {
  const next = { ...room, ...changes, updatedAt }
  const title = next.title.trim()
  if (!title) throw new Error('Room title is required')
  if (next.order < 0) throw new Error('Room order must be >= 0')
  return { ...next, title }
}
