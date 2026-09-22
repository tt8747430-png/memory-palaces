import { describe, expect, it, vi } from 'vitest'
import type { Identifiable, Repository } from '@/shared/api'

export function runRepositoryContract<T extends Identifiable>(
  name: string,
  createRepository: () => Repository<T>,
  makeEntity: (id: string) => T,
  /** The same entity with one field changed — what a single edit writes. */
  revise: (entity: T) => T,
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

    it('observe keeps the object of every entity a change did not touch', async () => {
      const repo = createRepository()
      await repo.save(makeEntity('a'))
      await repo.save(makeEntity('b'))
      const emissions: T[][] = []
      const unsubscribe = repo.observe((entities) => emissions.push(entities))
      await vi.waitFor(() => expect(emissions.at(-1)).toHaveLength(2))
      const before = emissions.at(-1)!
      const count = emissions.length

      await repo.save(revise(makeEntity('b')))
      await vi.waitFor(() => expect(emissions.length).toBeGreaterThan(count))
      const after = emissions.at(-1)!
      unsubscribe()

      // Every emission is the whole collection. One write must cost one new object, or every
      // subscriber's memo keyed on an entity breaks on every write anywhere in the collection.
      const byId = (list: T[], id: string) => list.find((entity) => entity.id === id)
      expect(byId(after, 'a')).toBe(byId(before, 'a'))
      expect(byId(after, 'b')).not.toBe(byId(before, 'b'))
      expect(byId(after, 'b')).toEqual(revise(makeEntity('b')))
    })
  })
}
