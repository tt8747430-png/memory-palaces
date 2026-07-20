import { describe, expect, it, vi } from 'vitest'
import type { Identifiable, Repository } from './base-repository'

export function runRepositoryContract<T extends Identifiable>(
  name: string,
  createRepository: () => Repository<T>,
  makeEntity: (id: string) => T,
): void {
  describe(`Repository contract: ${name}`, () => {
    it('returns null for a missing id', async () => {
      const repo = createRepository()
      expect(await repo.getById('missing')).toBeNull()
    })

    it('saves an entity and reads it back by id', async () => {
      const repo = createRepository()
      const entity = makeEntity('a')
      expect(await repo.save(entity)).toEqual(entity)
      expect(await repo.getById('a')).toEqual(entity)
    })

    it('getAll returns every saved entity', async () => {
      const repo = createRepository()
      await repo.save(makeEntity('a'))
      await repo.save(makeEntity('b'))
      const ids = (await repo.getAll()).map((entity) => entity.id).sort()
      expect(ids).toEqual(['a', 'b'])
    })

    it('save overwrites an entity with the same id', async () => {
      const repo = createRepository()
      await repo.save(makeEntity('a'))
      await repo.save(makeEntity('a'))
      expect(await repo.getAll()).toHaveLength(1)
    })

    it('remove deletes an entity', async () => {
      const repo = createRepository()
      await repo.save(makeEntity('a'))
      await repo.remove('a')
      expect(await repo.getById('a')).toBeNull()
    })

    it('does not alias stored entities (returns copies)', async () => {
      const repo = createRepository()
      const entity = makeEntity('a')
      await repo.save(entity)
      expect(await repo.getById('a')).not.toBe(entity)
    })

    it('observe emits the current entities immediately, then after every change', async () => {
      const repo = createRepository()
      const emissions: T[][] = []
      const unsubscribe = repo.observe((entities) => emissions.push(entities))

      await vi.waitFor(() => expect(emissions.at(-1)).toEqual([]))

      await repo.save(makeEntity('a'))
      await vi.waitFor(() => expect(emissions.at(-1)).toHaveLength(1))

      await repo.remove('a')
      await vi.waitFor(() => expect(emissions.at(-1)).toEqual([]))

      const countBeforeUnsubscribe = emissions.length
      unsubscribe()
      await repo.save(makeEntity('b'))
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(emissions).toHaveLength(countBeforeUnsubscribe)
    })
  })
}
