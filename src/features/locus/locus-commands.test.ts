import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createLocusStore, type Locus } from '@/entities/locus'
import { createLocus } from './create-locus'
import { editLocus } from './edit-locus'
import { deleteLocus } from './delete-locus'

function startedStore() {
  const store = createLocusStore(new InMemoryRepository<Locus>())
  store.getState().start()
  return store
}

describe('createLocus', () => {
  it('creates a locus under a room with trimmed front/back', async () => {
    const store = startedStore()

    const locus = await createLocus(store, 'r1', { front: '  Mihi  ', back: '  to me  ' })

    expect(locus.roomId).toBe('r1')
    expect(locus.front).toBe('Mihi')
    expect(locus.back).toBe('to me')
    expect(locus.flagged).toBe(false)
    expect(store.getState().loci).toHaveLength(1)
  })

  it('rejects an empty front or back', async () => {
    const store = startedStore()
    await expect(createLocus(store, 'r1', { front: '', back: 'x' })).rejects.toThrow(/front/i)
    await expect(createLocus(store, 'r1', { front: 'x', back: '   ' })).rejects.toThrow(/back/i)
  })
})

describe('editLocus', () => {
  it('updates fields and bumps updatedAt while preserving id and room', async () => {
    const store = startedStore()
    const locus = await createLocus(store, 'r1', { front: 'a', back: 'b' })

    const edited = await editLocus(store, locus.id, { back: 'B', hint: 'picture', flagged: true })

    expect(edited.id).toBe(locus.id)
    expect(edited.roomId).toBe('r1')
    expect(edited.back).toBe('B')
    expect(edited.hint).toBe('picture')
    expect(edited.flagged).toBe(true)
  })

  it('rejects clearing a required field', async () => {
    const store = startedStore()
    const locus = await createLocus(store, 'r1', { front: 'a', back: 'b' })
    await expect(editLocus(store, locus.id, { front: '  ' })).rejects.toThrow(/front/i)
  })

  it('throws when the locus does not exist', async () => {
    const store = startedStore()
    await expect(editLocus(store, 'missing', { back: 'x' })).rejects.toThrow(/not found/i)
  })
})

describe('deleteLocus', () => {
  it('removes the locus', async () => {
    const store = startedStore()
    const locus = await createLocus(store, 'r1', { front: 'a', back: 'b' })
    await deleteLocus(store, locus.id)
    expect(store.getState().loci).toEqual([])
  })
})
