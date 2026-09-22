import type { Identifiable, Repository, Unsubscribe } from './base-repository'

/**
 * A repository that lives in memory: the test double for every store, and the live `session` store.
 *
 * It keeps what the RxDB adapter keeps: an emission hands back the same object for every entity a
 * change did not touch, and a new one for the entity it did. What it holds is frozen, so a consumer
 * that edits an emitted entity in place — which would corrupt every other subscriber's copy, now
 * that the copy is shared — throws in a test instead of drifting on a device.
 */
export class InMemoryRepository<T extends Identifiable> implements Repository<T> {
  private readonly store = new Map<string, T>()
  private readonly listeners = new Set<(entities: T[]) => void>()

  constructor(seed: readonly T[] = []) {
    for (const entity of seed) this.store.set(entity.id, frozenCopy(entity))
  }

  async getAll(): Promise<T[]> {
    return [...this.store.values()].map((entity) => structuredClone(entity))
  }

  async getById(id: string): Promise<T | null> {
    const found = this.store.get(id)
    return found ? structuredClone(found) : null
  }

  async save(entity: T): Promise<T> {
    this.store.set(entity.id, frozenCopy(entity))
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
    return [...this.store.values()]
  }

  private emit(): void {
    const entities = this.snapshot()
    for (const listener of this.listeners) listener(entities)
  }
}

function frozenCopy<T>(value: T): T {
  return deepFreeze(structuredClone(value))
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
