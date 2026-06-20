import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createPalaceStore, type Palace } from '@/entities/palace'
import { createPalace } from './create-palace'
import { editPalace } from './edit-palace'
import { deletePalace } from './delete-palace'
import { duplicatePalace } from './duplicate-palace'
import { togglePalaceFavorite } from './toggle-favorite'
import { setPalaceArchived } from './set-archived'
import { setPalaceFolder } from './set-folder'

function startedStore() {
  const store = createPalaceStore(new InMemoryRepository<Palace>())
  store.getState().start()
  return store
}

describe('createPalace', () => {
  it('creates and persists a palace with a generated id, trimmed name, and timestamps', async () => {
    const store = startedStore()

    const palace = await createPalace(store, { name: '  Roman Forum  ' })

    expect(palace.id).toBeTruthy()
    expect(palace.name).toBe('Roman Forum')
    expect(palace.createdAt).toBe(palace.updatedAt)
    expect(store.getState().palaces.map((p) => p.id)).toEqual([palace.id])
  })
})

describe('editPalace', () => {
  it('applies changes and bumps updatedAt while preserving id and createdAt', async () => {
    const store = startedStore()
    const created = await createPalace(store, { name: 'Old' })

    const edited = await editPalace(store, created.id, { name: 'New', favorite: true })

    expect(edited.id).toBe(created.id)
    expect(edited.createdAt).toBe(created.createdAt)
    expect(edited.name).toBe('New')
    expect(edited.favorite).toBe(true)
    expect(store.getState().palaces[0]?.name).toBe('New')
  })

  it('rejects an empty name (entity invariant)', async () => {
    const store = startedStore()
    const created = await createPalace(store, { name: 'Keep' })
    await expect(editPalace(store, created.id, { name: '   ' })).rejects.toThrow(/name/i)
  })

  it('throws when the palace does not exist', async () => {
    const store = startedStore()
    await expect(editPalace(store, 'missing', { name: 'X' })).rejects.toThrow(/not found/i)
  })
})

describe('deletePalace', () => {
  it('removes the palace from the store and the repository', async () => {
    const store = startedStore()
    const created = await createPalace(store, { name: 'Gone' })

    await deletePalace(store, created.id)

    expect(store.getState().palaces).toEqual([])
  })
})

describe('duplicatePalace', () => {
  it('clones a palace with a fresh id and "(copy)" name, preserving content', async () => {
    const store = startedStore()
    const original = await createPalace(store, {
      name: 'Original',
      category: 'history',
      bibleMode: true,
    })

    const copy = await duplicatePalace(store, original.id)

    expect(copy.id).not.toBe(original.id)
    expect(copy.name).toBe('Original (copy)')
    expect(copy.category).toBe('history')
    expect(copy.bibleMode).toBe(true)
    expect(store.getState().palaces).toHaveLength(2)
  })
})

describe('togglePalaceFavorite', () => {
  it('flips the favorite flag on each call', async () => {
    const store = startedStore()
    const created = await createPalace(store, { name: 'Forum' })
    expect(created.favorite).toBe(false)

    const favorited = await togglePalaceFavorite(store, created.id)
    expect(favorited.favorite).toBe(true)

    const unfavorited = await togglePalaceFavorite(store, created.id)
    expect(unfavorited.favorite).toBe(false)
  })
})

describe('setPalaceArchived', () => {
  it('archives and restores a palace', async () => {
    const store = startedStore()
    const created = await createPalace(store, { name: 'Forum' })

    expect((await setPalaceArchived(store, created.id, true)).archived).toBe(true)
    expect((await setPalaceArchived(store, created.id, false)).archived).toBe(false)
  })
})

describe('setPalaceFolder', () => {
  it('files a palace into a folder and unfiles it with null', async () => {
    const store = startedStore()
    const created = await createPalace(store, { name: 'Forum' })

    expect((await setPalaceFolder(store, created.id, 'folder-1')).folderId).toBe('folder-1')
    expect((await setPalaceFolder(store, created.id, null)).folderId).toBeNull()
  })
})
