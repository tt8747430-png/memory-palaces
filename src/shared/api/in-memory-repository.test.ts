import { describe, expect, it } from 'vitest'
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
  (thing) => ({ ...thing, value: thing.value + 1 }),
)

describe('InMemoryRepository', () => {
  it('freezes what it emits, so a consumer that edits an entity in place fails here, not on device', async () => {
    const repo = new InMemoryRepository<Thing>([{ id: 'a', value: 1 }])
    const emissions: Thing[][] = []
    repo.observe((things) => emissions.push(things))
    const [thing] = emissions.at(-1)!
    expect(() => {
      ;(thing as Thing).value = 2
    }).toThrow(TypeError)
  })
})
