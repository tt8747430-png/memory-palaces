import type { Identifiable } from '@/shared/api'

export interface Entity extends Identifiable {
  createdAt: string
  updatedAt: string
}

export function newId(): string {
  return crypto.randomUUID()
}

export function cloneEntity<T extends Entity>(entity: T, id: string, now: string): T {
  return { ...structuredClone(entity), id, createdAt: now, updatedAt: now }
}

export function findEntity<T extends Identifiable>(
  entities: readonly T[],
  id: string | null | undefined,
): T | undefined {
  return id == null ? undefined : entities.find((candidate) => candidate.id === id)
}

export function requireEntity<T extends Identifiable>(
  entities: readonly T[],
  id: string,
  label: string,
): T {
  const entity = findEntity(entities, id)
  if (!entity) throw new Error(`${label} not found: ${id}`)
  return entity
}

/** Each entity's place in `entities`, by id — for a row's number, read without a scan per row. */
export function positionsById(entities: readonly Identifiable[]): ReadonlyMap<string, number> {
  return new Map(entities.map((entity, position) => [entity.id, position]))
}
