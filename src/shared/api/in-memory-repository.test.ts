import { runRepositoryContract } from '@/shared/test/repository-contract'
import type { Identifiable } from './base-repository'
import { InMemoryRepository } from './in-memory-repository'

interface Thing extends Identifiable {
  value: number
}

runRepositoryContract<Thing>(
  'InMemoryRepository',
  () => new InMemoryRepository<Thing>(),
  (id) => ({ id, value: 1 }),
)
