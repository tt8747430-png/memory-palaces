import type { Identifiable } from '@/shared/api'

/**
 * Base shape every domain entity extends: a stable id plus ISO timestamps.
 * `createdAt`/`updatedAt` order edits and become server-time once sync lands;
 * soft-delete tombstones are added in Phase 9 when replication needs them.
 */
export interface Entity extends Identifiable {
  createdAt: string
  updatedAt: string
}

/**
 * Prototype clone: a deep copy with a fresh identity and timestamps. One generic
 * helper serves every entity (the per-entity copies were byte-identical). Deep
 * cascades (a palace with its rooms/loci) are a feature concern, not this.
 */
export function cloneEntity<T extends Entity>(entity: T, id: string, now: string): T {
  return { ...structuredClone(entity), id, createdAt: now, updatedAt: now }
}
