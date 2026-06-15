import type { Identifiable, Repository, Unsubscribe } from './base-repository'

/**
 * In-memory adapter for the generic {@link Repository} port. Map-backed, fully
 * synchronous under the hood but Promise-returning to match the async ports the
 * RxDB/Supabase adapters will expose (Liskov: it must pass the same contract).
 * Backs unit tests and the offline-first walking skeleton until RxDB lands (Phase 3).
 */
export class InMemoryRepository<T extends Identifiable> implements Repository<T> {
  private readonly store = new Map<string, T>()
  private readonly listeners = new Set<(entities: T[]) => void>()

  constructor(seed: readonly T[] = []) {
    for (const entity of seed) this.store.set(entity.id, structuredClone(entity))
  }

  async getAll(): Promise<T[]> {
    return this.snapshot()
  }

  async getById(id: string): Promise<T | null> {
    const found = this.store.get(id)
    return found ? structuredClone(found) : null
  }

  async save(entity: T): Promise<T> {
    this.store.set(entity.id, structuredClone(entity))
    this.emit()
    return structuredClone(entity)
  }

  async remove(id: string): Promise<void> {
    this.store.delete(id)
    this.emit()
  }

  observe(listener: (entities: T[]) => void): Unsubscribe {
    listener(this.snapshot())
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private snapshot(): T[] {
    return [...this.store.values()].map((entity) => structuredClone(entity))
  }

  private emit(): void {
    const entities = this.snapshot()
    for (const listener of this.listeners) listener(entities)
  }
}
