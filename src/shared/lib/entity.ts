import type { Identifiable } from '@/shared/api'

export interface Entity extends Identifiable {
  createdAt: string
  updatedAt: string
}

/** The one source of entity ids. Nothing else calls `crypto.randomUUID`. */
export function newId(): string {
  return crypto.randomUUID()
}

export function cloneEntity<T extends Entity>(entity: T, id: string, now: string): T {
  return { ...structuredClone(entity), id, createdAt: now, updatedAt: now }
}

/**
 * Looks an entity up by id. A null id — no deck open, nothing selected — is a
 * miss rather than an error, so callers can hand a route param straight in.
 */
export function findEntity<T extends Identifiable>(
  entities: readonly T[],
  id: string | null | undefined,
): T | undefined {
  return id == null ? undefined : entities.find((candidate) => candidate.id === id)
}

/** Looks an entity up by id, throwing with `label` when the id is stale. */
export function requireEntity<T extends Identifiable>(
  entities: readonly T[],
  id: string,
  label: string,
): T {
  const entity = findEntity(entities, id)
  if (!entity) throw new Error(`${label} not found: ${id}`)
  return entity
}
