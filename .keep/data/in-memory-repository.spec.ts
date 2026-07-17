import { runRepositoryContract } from './repository-contract'
import type { Identifiable } from './base-repository'
import { InMemoryRepository } from './in-memory-repository'

interface Thing extends Identifiable {
  value: number
}

runRepositoryContract<Thing>(
  'InMemoryRepository',
  () => new InMemoryRepository<Thing>(),
  (id: string) => ({ id, value: 1 }),
)
