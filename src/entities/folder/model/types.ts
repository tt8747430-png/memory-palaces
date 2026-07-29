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
  const order = input.order ?? 0
  if (order < 0) throw new Error('Folder order must be >= 0')
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    name,
    color: input.color,
    icon: input.icon,
    order,
  }
}

export type FolderChanges = Partial<Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>>

export function updateFolder(folder: Folder, changes: FolderChanges, updatedAt: string): Folder {
  const next = { ...folder, ...changes, updatedAt }
  const name = next.name.trim()
  if (!name) throw new Error('Folder name is required')
  if (next.order < 0) throw new Error('Folder order must be >= 0')
  return { ...next, name }
}
