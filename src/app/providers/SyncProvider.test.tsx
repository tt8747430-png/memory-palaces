import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import {
  InMemoryRepository,
  LocalObjectUrlStorage,
  type PersistedAuth,
  type StoragePort,
} from '@/shared/api'
import { createDeckStore, type Deck, DeckStoreContext } from '@/entities/deck'
import { createProfileStore, type Profile, ProfileStoreContext } from '@/entities/profile'
import { SyncProvider, type SyncController } from './SyncProvider'

const account: PersistedAuth = { id: 'u1', kind: 'account' }
const otherAccount: PersistedAuth = { id: 'u2', kind: 'account' }
const guest: PersistedAuth = { id: 'g1', kind: 'guest' }
const noop = () => Promise.resolve()
const storage: StoragePort = new LocalObjectUrlStorage()

afterEach(() => {
  cleanup()
  setVisibility('visible')
})

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value, configurable: true })
}

function controller() {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    flush: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
  }
}

/** The provider reconciles inline images too, so it needs the stores those images live in. */
function wrap(children: ReactNode) {
  return (
    <I18nextProvider i18n={i18n}>
      <DeckStoreContext value={createDeckStore(new InMemoryRepository<Deck>())}>
        <ProfileStoreContext value={createProfileStore(new InMemoryRepository<Profile>())}>
          {children}
        </ProfileStoreContext>
      </DeckStoreContext>
    </I18nextProvider>
  )
}

function provider(options: {
  syncManager: SyncController | null
  auth: PersistedAuth | null
  resetLocal?: () => Promise<void>
}) {
  const { syncManager, auth, resetLocal = noop } = options
  return wrap(
    <SyncProvider
      syncManager={syncManager}
      auth={auth}
      resetLocal={resetLocal}
      storage={storage}
    />,
  )
}

describe('SyncProvider', () => {
  it('starts replication for the signed-in account', () => {
    const syncManager = controller()
    render(provider({ syncManager, auth: account }))

    expect(syncManager.start).toHaveBeenCalledWith('u1')
  })

  it('does nothing for a guest — their data stays on-device until they sign up', () => {
    const syncManager = controller()
    render(provider({ syncManager, auth: guest }))

    expect(syncManager.start).not.toHaveBeenCalled()
  })

  it('does nothing when Supabase is not configured', () => {
    expect(() => render(provider({ syncManager: null, auth: account }))).not.toThrow()
  })

  it('flushes when the app is backgrounded', () => {
    const syncManager = controller()
    render(provider({ syncManager, auth: account }))

    setVisibility('hidden')
    document.dispatchEvent(new Event('visibilitychange'))

    expect(syncManager.flush).toHaveBeenCalled()
  })

  it('does not flush when the app merely regains focus', () => {
    const syncManager = controller()
    render(provider({ syncManager, auth: account }))

    document.dispatchEvent(new Event('visibilitychange'))

    expect(syncManager.flush).not.toHaveBeenCalled()
  })

  it('flushes on pagehide, whatever the visibility says', () => {
    const syncManager = controller()
    render(provider({ syncManager, auth: account }))

    window.dispatchEvent(new Event('pagehide'))

    expect(syncManager.flush).toHaveBeenCalled()
  })

  it('stops replication and its listeners on unmount', () => {
    const syncManager = controller()
    const { unmount } = render(provider({ syncManager, auth: account }))

    unmount()
    window.dispatchEvent(new Event('pagehide'))

    expect(syncManager.stop).toHaveBeenCalled()
    expect(syncManager.flush).not.toHaveBeenCalled()
  })

  it('pushes the outgoing account’s work before wiping for a different one', async () => {
    const syncManager = controller()
    const resetLocal = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(provider({ syncManager, auth: account, resetLocal }))

    rerender(provider({ syncManager, auth: otherAccount, resetLocal }))

    await waitFor(() => expect(resetLocal).toHaveBeenCalled())
    expect(syncManager.flush).toHaveBeenCalled()
  })

  it('keeps the local data when a guest signs up — that is the claim', async () => {
    const syncManager = controller()
    const resetLocal = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(provider({ syncManager, auth: guest, resetLocal }))

    rerender(provider({ syncManager, auth: account, resetLocal }))

    await waitFor(() => expect(syncManager.start).toHaveBeenCalledWith('u1'))
    expect(resetLocal).not.toHaveBeenCalled()
  })

  it('asks the browser to keep the local database', () => {
    const persist = vi.fn().mockResolvedValue(true)
    Object.defineProperty(navigator, 'storage', { value: { persist }, configurable: true })

    render(provider({ syncManager: controller(), auth: account }))

    expect(persist).toHaveBeenCalled()
  })
})
