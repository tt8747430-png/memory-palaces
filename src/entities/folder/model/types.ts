import type { Entity } from '@/shared/lib'

export interface Folder extends Entity {
  name: string
  color: string
  icon: string
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

export interface FolderChanges {
  name?: string
  color?: string
  icon?: string
  order?: number
}

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
