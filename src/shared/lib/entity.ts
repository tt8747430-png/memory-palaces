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
