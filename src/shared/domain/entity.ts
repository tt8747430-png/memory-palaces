import type { Identifiable } from '@/shared/data'

export interface Entity extends Identifiable {
  createdAt: string
  updatedAt: string
}

export function cloneEntity<T extends Entity>(entity: T, id: string, now: string): T {
  return { ...structuredClone(entity), id, createdAt: now, updatedAt: now }
}
