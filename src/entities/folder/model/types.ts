import type { Entity } from '@/shared/lib'

/** A flat, hand-orderable grouping that holds palaces (folders do not nest). */
export interface Folder extends Entity {
  name: string
  color: string
  icon: string
  /** Manual sort position among the library's folders. */
  order: number
}

export interface MakeFolderInput {
  id: string
  createdAt: string
  name: string
  color: string
  icon: string
  order?: number
}

export function makeFolder(input: MakeFolderInput): Folder {
  const name = input.name.trim()
  if (!name) throw new Error('Folder name is required')
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    name,
    color: input.color,
    icon: input.icon,
    order: input.order ?? 0,
  }
}

/** The editable fields of a folder; any subset can change in one edit. */
export interface FolderChanges {
  name?: string
  color?: string
  icon?: string
  order?: number
}

/** Apply edits to a folder, re-validating the name and stamping `updatedAt`. Pure — the
 * command layer supplies the clock, so this stays testable and IO-free. */
export function updateFolder(folder: Folder, changes: FolderChanges, now: string): Folder {
  const next: Folder = { ...folder, updatedAt: now }
  if (changes.name !== undefined) {
    const name = changes.name.trim()
    if (!name) throw new Error('Folder name is required')
    next.name = name
  }
  if (changes.color !== undefined) next.color = changes.color
  if (changes.icon !== undefined) next.icon = changes.icon
  if (changes.order !== undefined) next.order = changes.order
  return next
}
