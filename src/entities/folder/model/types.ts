import type { Entity } from '@/shared/lib'

/** A user-defined collection that groups palaces. */
export interface Folder extends Entity {
  name: string
  color: string
  icon: string
}

export interface MakeFolderInput {
  id: string
  createdAt: string
  name: string
  color: string
  icon: string
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
  }
}
