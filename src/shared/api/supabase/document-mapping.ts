import type { Identifiable } from '@/shared/api'

export interface Row {
  id: string
  data: Record<string, unknown>
  deleted: boolean
  updated_at?: string
}

/** The server copy a device last saw of one document, as much of it as the server compares. */
export interface PushBase {
  updatedAt: string
  deleted: boolean
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
  /** Whether that copy was a deletion. A deletion keeps its clock, so `base` alone cannot say. */
  base_deleted: boolean
}

export function docToRow<T extends Identifiable>(
  doc: T & { _deleted?: boolean },
  userId: string,
  base: PushBase | null,
): PushRow {
  const { _deleted, ...data } = doc
  return {
    id: doc.id,
    user_id: userId,
    data,
    deleted: Boolean(_deleted),
    base: base?.updatedAt ?? null,
    base_deleted: base?.deleted ?? false,
  }
}

export function rowToDoc<T extends Identifiable>(row: Row): T & { _deleted: boolean } {
  return { ...(row.data as T), _deleted: row.deleted }
}
