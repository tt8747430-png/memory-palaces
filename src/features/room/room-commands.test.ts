import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createRoomStore, type Room } from '@/entities/room'
import { createRoom } from './create-room'
import { editRoom } from './edit-room'
import { deleteRoom } from './delete-room'
import { moveRoom } from './move-room'

function startedStore() {
  const store = createRoomStore(new InMemoryRepository<Room>())
  store.getState().start()
  return store
}

const titlesInPalace = (store: ReturnType<typeof startedStore>, palaceId: string) =>
  store
    .getState()
    .rooms.filter((room) => room.palaceId === palaceId)
    .map((room) => room.title)

describe('createRoom', () => {
  it('appends to the palace with the next order index and a trimmed title', async () => {
    const store = startedStore()

    const first = await createRoom(store, 'p1', { title: '  Kitchen  ' })
    const second = await createRoom(store, 'p1', { title: 'Hallway' })

    expect(first.title).toBe('Kitchen')
    expect(first.palaceId).toBe('p1')
    expect(first.order).toBe(0)
    expect(second.order).toBe(1)
    expect(store.getState().rooms).toHaveLength(2)
  })

  it('numbers order independently per palace', async () => {
    const store = startedStore()
    await createRoom(store, 'p1', { title: 'A' })
    const other = await createRoom(store, 'p2', { title: 'B' })
    expect(other.order).toBe(0)
  })
})

describe('editRoom', () => {
  it('updates fields and bumps updatedAt while preserving id and order', async () => {
    const store = startedStore()
    const room = await createRoom(store, 'p1', { title: 'Old' })

    const edited = await editRoom(store, room.id, { title: 'New', description: 'desc' })

    expect(edited.id).toBe(room.id)
    expect(edited.order).toBe(room.order)
    expect(edited.title).toBe('New')
    expect(edited.description).toBe('desc')
  })

  it('rejects an empty title (entity invariant)', async () => {
    const store = startedStore()
    const room = await createRoom(store, 'p1', { title: 'Keep' })
    await expect(editRoom(store, room.id, { title: '  ' })).rejects.toThrow(/title/i)
  })

  it('throws when the room does not exist', async () => {
    const store = startedStore()
    await expect(editRoom(store, 'missing', { title: 'X' })).rejects.toThrow(/not found/i)
  })
})

describe('deleteRoom', () => {
  it('removes the room from the store and repository', async () => {
    const store = startedStore()
    const room = await createRoom(store, 'p1', { title: 'Gone' })
    await deleteRoom(store, room.id)
    expect(store.getState().rooms).toEqual([])
  })
})

describe('moveRoom', () => {
  it('swaps order with the neighbor in the given direction', async () => {
    const store = startedStore()
    await createRoom(store, 'p1', { title: 'A' })
    await createRoom(store, 'p1', { title: 'B' })
    const c = await createRoom(store, 'p1', { title: 'C' })

    await moveRoom(store, c.id, 'up')
    expect(titlesInPalace(store, 'p1')).toEqual(['A', 'C', 'B'])

    const a = store.getState().rooms.find((room) => room.title === 'A')!
    await moveRoom(store, a.id, 'down')
    expect(titlesInPalace(store, 'p1')).toEqual(['C', 'A', 'B'])
  })

  it('is a no-op at the edges', async () => {
    const store = startedStore()
    const a = await createRoom(store, 'p1', { title: 'A' })
    const b = await createRoom(store, 'p1', { title: 'B' })

    await moveRoom(store, a.id, 'up')
    await moveRoom(store, b.id, 'down')

    expect(titlesInPalace(store, 'p1')).toEqual(['A', 'B'])
  })

  it('reorders only within the same palace', async () => {
    const store = startedStore()
    await createRoom(store, 'p1', { title: 'A1' })
    const p2first = await createRoom(store, 'p2', { title: 'B1' })

    await moveRoom(store, p2first.id, 'up')

    expect(titlesInPalace(store, 'p1')).toEqual(['A1'])
    expect(titlesInPalace(store, 'p2')).toEqual(['B1'])
  })
})
