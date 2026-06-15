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
