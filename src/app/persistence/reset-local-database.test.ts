import { describe, expect, it, vi } from 'vitest'
import type { AppCollections } from './database'
import { resetLocalDatabase } from './reset-local-database'

function collectionsWith(remove: () => Promise<string[]>) {
  return Promise.resolve({
    decks: { database: { remove } },
  } as unknown as AppCollections)
}

describe('resetLocalDatabase', () => {
  it('removes the database and reloads so every store is rebuilt', async () => {
    const remove = vi.fn().mockResolvedValue([])
    const reload = vi.fn()

    await resetLocalDatabase({ collections: collectionsWith(remove), location: { reload } })

    expect(remove).toHaveBeenCalled()
    expect(reload).toHaveBeenCalled()
  })

  it('does not reload if the wipe failed — half-wiped data must not be re-mounted', async () => {
    const reload = vi.fn()
    const collections = collectionsWith(() => Promise.reject(new Error('locked')))

    await expect(resetLocalDatabase({ collections, location: { reload } })).rejects.toThrow(
      'locked',
    )
    expect(reload).not.toHaveBeenCalled()
  })
})
