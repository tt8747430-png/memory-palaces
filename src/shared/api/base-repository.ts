/** Anything stored by a repository carries a stable string id. */
export interface Identifiable {
  id: string
}

/**
 * Generic repository PORT (hexagonal boundary). The domain depends on this
 * interface; concrete ADAPTERS implement it — `InMemoryRepository` now (and in
 * tests), RxDB + Supabase later — and are wired in at the composition root
 * (Dependency Inversion). It is generic over the entity type, so a single adapter
 * serves every entity without `shared` ever importing an `entities` type.
 */
export interface Repository<T extends Identifiable> {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | null>
  save(entity: T): Promise<T>
  remove(id: string): Promise<void>
}
