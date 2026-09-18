import type { Identifiable } from '@/shared/api'

export interface Row {
  id: string
  data: Record<string, unknown>
  deleted: boolean
  updated_at?: string
}

export interface PushRow {
  id: string
  user_id: string
  data: Record<string, unknown>
  deleted: boolean
  /**
   * The `updatedAt` of the server copy this device last saw, or null when it never pulled one. The
   * server applies the row only over that copy; anything else comes back to be merged against it.
   */
  base: string | null
}

export function docToRow<T extends Identifiable>(
  doc: T & { _deleted?: boolean },
  userId: string,
  base: string | null,
): PushRow {
  const { _deleted, ...data } = doc
  return { id: doc.id, user_id: userId, data, deleted: Boolean(_deleted), base }
}

export function rowToDoc<T extends Identifiable>(row: Row): T & { _deleted: boolean } {
  return { ...(row.data as T), _deleted: row.deleted }
}
