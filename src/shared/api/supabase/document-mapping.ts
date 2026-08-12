import type { Identifiable } from '@/shared/api'

/** A row as it comes back from a pull. */
export interface Row {
  id: string
  data: Record<string, unknown>
  deleted: boolean
  updated_at?: string
}

/** A row as it goes out on a push — no `updated_at`: the server trigger owns that column. */
export interface PushRow {
  id: string
  user_id: string
  data: Record<string, unknown>
  deleted: boolean
}

/**
 * The one place documents and rows meet. Keeping the translation here means push, pull and the
 * realtime stream cannot drift from each other.
 */
export function docToRow<T extends Identifiable>(
  doc: T & { _deleted?: boolean },
  userId: string,
): PushRow {
  const { _deleted, ...data } = doc
  return { id: doc.id, user_id: userId, data, deleted: Boolean(_deleted) }
}

export function rowToDoc<T extends Identifiable>(row: Row): T & { _deleted: boolean } {
  return { ...(row.data as T), _deleted: row.deleted }
}
