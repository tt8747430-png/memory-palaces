import { describe, expect, it, vi } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createCollectionStore } from './entity-store'

interface Thing {
  id: string
  value: number
  repaired?: boolean
}

const byId = (a: Thing, b: Thing) => a.id.localeCompare(b.id)

describe('createCollectionStore', () => {
  it('repairs each stored entity once, so an untouched one keeps its object across emissions', async () => {
    const repo = new InMemoryRepository<Thing>([
      { id: 'a', value: 1 },
      { id: 'b', value: 1 },
    ])
    const complete = vi.fn((thing: Thing) => ({ ...thing, repaired: true }))
    const store = createCollectionStore('things', repo, byId, { complete })
    store.getState().start()
    const [a1, b1] = store.getState().things

    await store.getState().save({ id: 'b', value: 2 })
    const [a2, b2] = store.getState().things

    expect(a2).toBe(a1)
    expect(b2).not.toBe(b1)
    expect(b2).toEqual({ id: 'b', value: 2, repaired: true })
    // Two at the start, one for the entity the write changed — not two more per emission.
    expect(complete).toHaveBeenCalledTimes(3)
  })
})
