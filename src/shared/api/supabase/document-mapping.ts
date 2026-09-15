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
}

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
