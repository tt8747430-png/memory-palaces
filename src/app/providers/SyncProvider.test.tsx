import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import type { PersistedAuth } from '@/shared/api'
import { SyncProvider, type SyncController } from './SyncProvider'

const account: PersistedAuth = { id: 'u1', kind: 'account' }
const otherAccount: PersistedAuth = { id: 'u2', kind: 'account' }
const guest: PersistedAuth = { id: 'g1', kind: 'guest' }
const noop = () => Promise.resolve()

afterEach(() => {
  cleanup()
  setVisibility('visible')
})

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value, configurable: true })
}

function controller(): SyncController & {
  start: ReturnType<typeof vi.fn>
  flush: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
} {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    flush: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
  }
}

describe('SyncProvider', () => {
  it('starts replication for the signed-in account', () => {
    const syncManager = controller()
    render(<SyncProvider syncManager={syncManager} auth={account} resetLocal={noop} />)

    expect(syncManager.start).toHaveBeenCalledWith('u1')
  })

  it('does nothing for a guest — their data stays on-device until they sign up', () => {
    const syncManager = controller()
    render(<SyncProvider syncManager={syncManager} auth={guest} resetLocal={noop} />)

    expect(syncManager.start).not.toHaveBeenCalled()
  })

  it('does nothing when Supabase is not configured', () => {
    expect(() =>
      render(<SyncProvider syncManager={null} auth={account} resetLocal={noop} />),
    ).not.toThrow()
  })

  it('flushes when the app is backgrounded', () => {
    const syncManager = controller()
    render(<SyncProvider syncManager={syncManager} auth={account} resetLocal={noop} />)

    setVisibility('hidden')
    document.dispatchEvent(new Event('visibilitychange'))

    expect(syncManager.flush).toHaveBeenCalled()
  })

  it('does not flush when the app merely regains focus', () => {
    const syncManager = controller()
    render(<SyncProvider syncManager={syncManager} auth={account} resetLocal={noop} />)

    document.dispatchEvent(new Event('visibilitychange'))

    expect(syncManager.flush).not.toHaveBeenCalled()
  })

  it('flushes on pagehide, whatever the visibility says', () => {
    const syncManager = controller()
    render(<SyncProvider syncManager={syncManager} auth={account} resetLocal={noop} />)

    window.dispatchEvent(new Event('pagehide'))

    expect(syncManager.flush).toHaveBeenCalled()
  })

  it('stops replication and its listeners on unmount', () => {
    const syncManager = controller()
    const { unmount } = render(
      <SyncProvider syncManager={syncManager} auth={account} resetLocal={noop} />,
    )

    unmount()
    window.dispatchEvent(new Event('pagehide'))

    expect(syncManager.stop).toHaveBeenCalled()
    expect(syncManager.flush).not.toHaveBeenCalled()
  })

  it('wipes the local database when a different account signs in', async () => {
    const syncManager = controller()
    const resetLocal = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(
      <SyncProvider syncManager={syncManager} auth={account} resetLocal={resetLocal} />,
    )

    rerender(<SyncProvider syncManager={syncManager} auth={otherAccount} resetLocal={resetLocal} />)

    await waitFor(() => expect(resetLocal).toHaveBeenCalled())
  })

  it('keeps the local data when a guest signs up — that is the claim', async () => {
    const syncManager = controller()
    const resetLocal = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(
      <SyncProvider syncManager={syncManager} auth={guest} resetLocal={resetLocal} />,
    )

    rerender(<SyncProvider syncManager={syncManager} auth={account} resetLocal={resetLocal} />)

    await waitFor(() => expect(syncManager.start).toHaveBeenCalledWith('u1'))
    expect(resetLocal).not.toHaveBeenCalled()
  })

  it('asks the browser to keep the local database', () => {
    const persist = vi.fn().mockResolvedValue(true)
    Object.defineProperty(navigator, 'storage', { value: { persist }, configurable: true })

    render(<SyncProvider syncManager={controller()} auth={account} resetLocal={noop} />)

    expect(persist).toHaveBeenCalled()
  })
})
