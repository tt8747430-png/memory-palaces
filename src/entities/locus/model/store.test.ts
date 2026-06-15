import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createLocusStore } from './store'
import { makeLocus, type Locus } from './types'

const at = (ms: number) => new Date(ms).toISOString()
const locus = (id: string, roomId: string, createdAt: string, front = id): Locus =>
  makeLocus({ id, createdAt, roomId, front, back: 'back' })

describe('locus store — reactive, Dependency Injection', () => {
  it('start() hydrates loci from the injected repository and becomes ready', () => {
    const repo = new InMemoryRepository<Locus>([locus('l1', 'r1', at(0))])
    const store = createLocusStore(repo)
    expect(store.getState().status).toBe('idle')

    store.getState().start()

    expect(store.getState().status).toBe('ready')
    expect(store.getState().loci.map((l) => l.id)).toEqual(['l1'])
  })

  it('reflects saves and removes reactively, persisting through the port', async () => {
    const repo = new InMemoryRepository<Locus>()
    const store = createLocusStore(repo)
    store.getState().start()

    await store.getState().save(locus('l1', 'r1', at(0)))
    expect(store.getState().loci).toHaveLength(1)
    expect(await repo.getById('l1')).not.toBeNull()

    await store.getState().remove('l1')
    expect(store.getState().loci).toHaveLength(0)
  })

  it('orders loci oldest-first by createdAt', async () => {
    const repo = new InMemoryRepository<Locus>()
    const store = createLocusStore(repo)
    store.getState().start()

    await store.getState().save(locus('new', 'r1', at(1000)))
    await store.getState().save(locus('old', 'r1', at(0)))

    expect(store.getState().loci.map((l) => l.id)).toEqual(['old', 'new'])
  })

  it('stop() ends reactivity', async () => {
    const repo = new InMemoryRepository<Locus>()
    const store = createLocusStore(repo)
    store.getState().start()
    store.getState().stop()

    await repo.save(locus('l1', 'r1', at(0)))

    expect(store.getState().loci).toEqual([])
  })
})
