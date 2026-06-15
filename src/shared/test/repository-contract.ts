import { describe, expect, it } from 'vitest'
import type { Identifiable, Repository } from '@/shared/api'

/**
 * The behavioral contract every `Repository<T>` adapter must satisfy. Run it
 * against each adapter (in-memory now, RxDB/Supabase later) so they stay
 * interchangeable — Liskov enforced by a shared suite rather than by hope.
 */
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
  })
}
