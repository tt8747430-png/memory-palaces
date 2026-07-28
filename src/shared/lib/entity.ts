import type { Identifiable } from '@/shared/api'

export interface Entity extends Identifiable {
  createdAt: string
  updatedAt: string
}

export function cloneEntity<T extends Entity>(entity: T, id: string, now: string): T {
  return { ...structuredClone(entity), id, createdAt: now, updatedAt: now }
}

/** Looks an entity up by id, throwing with `label` when the id is stale. */
export function requireEntity<T extends Identifiable>(
  entities: readonly T[],
  id: string,
  label: string,
): T {
  const entity = entities.find((candidate) => candidate.id === id)
  if (!entity) throw new Error(`${label} not found: ${id}`)
  return entity
}
