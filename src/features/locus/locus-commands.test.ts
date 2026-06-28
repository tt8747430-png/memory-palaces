import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { srsStatus } from '@/shared/lib'
import { createLocusStore, lociForRoom, type Locus, selectLoci } from '@/entities/locus'
import { createLocus } from './create-locus'
import { editLocus } from './edit-locus'
import { deleteLocus } from './delete-locus'
import { markRoomKnown } from './mark-room-known'
import { resetRoomSrs } from './reset-room-srs'
import { reorderLoci } from './reorder-loci'
import { duplicateLocus } from './duplicate-locus'
import { toggleLocusFlag } from './toggle-locus-flag'

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

describe('markRoomKnown', () => {
  it('marks every locus in the room as known, leaving other rooms untouched', async () => {
    const store = startedStore()
    await createLocus(store, 'r1', { front: 'a', back: 'A' })
    await createLocus(store, 'r1', { front: 'b', back: 'B' })
    const other = await createLocus(store, 'r2', { front: 'c', back: 'C' })

    await markRoomKnown(store, 'r1')

    const inRoom = lociForRoom(selectLoci(store.getState()), 'r1')
    expect(inRoom.every((locus) => srsStatus(locus.srs) === 'known')).toBe(true)
    const untouched = store.getState().loci.find((locus) => locus.id === other.id)
    expect(untouched?.srs).toBeUndefined()
  })
})

describe('resetRoomSrs', () => {
  it('clears the schedule of every locus in the room back to new', async () => {
    const store = startedStore()
    await createLocus(store, 'r1', { front: 'a', back: 'A' })
    await createLocus(store, 'r1', { front: 'b', back: 'B' })
    await markRoomKnown(store, 'r1')

    await resetRoomSrs(store, 'r1')

    const inRoom = lociForRoom(selectLoci(store.getState()), 'r1')
    expect(inRoom.every((locus) => locus.srs === undefined)).toBe(true)
    expect(inRoom.every((locus) => srsStatus(locus.srs) === 'new')).toBe(true)
  })
})

const frontsForRoom = (store: ReturnType<typeof startedStore>) =>
  lociForRoom(selectLoci(store.getState()), 'r1').map((locus) => locus.front)

describe('createLocus order', () => {
  it('appends each new card after the last', async () => {
    const store = startedStore()
    await createLocus(store, 'r1', { front: 'a', back: 'A' })
    await createLocus(store, 'r1', { front: 'b', back: 'B' })
    await createLocus(store, 'r1', { front: 'c', back: 'C' })
    expect(frontsForRoom(store)).toEqual(['a', 'b', 'c'])
  })
})

describe('reorderLoci', () => {
  it('writes each card its index in the supplied order and renumbers the room', async () => {
    const store = startedStore()
    const a = await createLocus(store, 'r1', { front: 'a', back: 'A' })
    const b = await createLocus(store, 'r1', { front: 'b', back: 'B' })
    const c = await createLocus(store, 'r1', { front: 'c', back: 'C' })

    await reorderLoci(store, [c.id, a.id, b.id])

    expect(frontsForRoom(store)).toEqual(['c', 'a', 'b'])
    const byFront = (front: string) => store.getState().loci.find((locus) => locus.front === front)!
    expect(byFront('c').order).toBe(0)
    expect(byFront('a').order).toBe(1)
    expect(byFront('b').order).toBe(2)
  })

  it('persists only the cards whose order actually changed', async () => {
    const store = startedStore()
    const a = await createLocus(store, 'r1', { front: 'a', back: 'A' })
    const b = await createLocus(store, 'r1', { front: 'b', back: 'B' })
    const before = store.getState().loci.find((locus) => locus.front === 'a')!.updatedAt

    await reorderLoci(store, [a.id, b.id])

    expect(store.getState().loci.find((locus) => locus.front === 'a')!.updatedAt).toBe(before)
    expect(frontsForRoom(store)).toEqual(['a', 'b'])
  })
})

describe('duplicateLocus', () => {
  it('copies the content into a fresh card appended to the room', async () => {
    const store = startedStore()
    const a = await createLocus(store, 'r1', { front: 'a', back: 'A', hint: 'picture' })
    const copy = await duplicateLocus(store, a.id)

    expect(copy.id).not.toBe(a.id)
    expect(copy.front).toBe('a')
    expect(copy.hint).toBe('picture')
    expect(copy.srs).toBeUndefined()
    expect(frontsForRoom(store)).toEqual(['a', 'a'])
  })
})

describe('toggleLocusFlag', () => {
  it('flips the flagged mark', async () => {
    const store = startedStore()
    const a = await createLocus(store, 'r1', { front: 'a', back: 'A' })
    expect(a.flagged).toBe(false)
    expect((await toggleLocusFlag(store, a.id)).flagged).toBe(true)
    expect((await toggleLocusFlag(store, a.id)).flagged).toBe(false)
  })
})
