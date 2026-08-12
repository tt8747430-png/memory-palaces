import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { SyncProvider, type SyncController } from './SyncProvider'

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
    render(<SyncProvider syncManager={syncManager} userId="u1" />)

    expect(syncManager.start).toHaveBeenCalledWith('u1')
  })

  it('does nothing without an account — a guest stays on-device', () => {
    const syncManager = controller()
    render(<SyncProvider syncManager={syncManager} userId={null} />)

    expect(syncManager.start).not.toHaveBeenCalled()
  })

  it('does nothing when Supabase is not configured', () => {
    expect(() => render(<SyncProvider syncManager={null} userId="u1" />)).not.toThrow()
  })

  it('flushes when the app is backgrounded', () => {
    const syncManager = controller()
    render(<SyncProvider syncManager={syncManager} userId="u1" />)

    setVisibility('hidden')
    document.dispatchEvent(new Event('visibilitychange'))

    expect(syncManager.flush).toHaveBeenCalled()
  })

  it('does not flush when the app merely regains focus', () => {
    const syncManager = controller()
    render(<SyncProvider syncManager={syncManager} userId="u1" />)

    document.dispatchEvent(new Event('visibilitychange'))

    expect(syncManager.flush).not.toHaveBeenCalled()
  })

  it('flushes on pagehide, whatever the visibility says', () => {
    const syncManager = controller()
    render(<SyncProvider syncManager={syncManager} userId="u1" />)

    window.dispatchEvent(new Event('pagehide'))

    expect(syncManager.flush).toHaveBeenCalled()
  })

  it('stops replication and its listeners on unmount', () => {
    const syncManager = controller()
    const { unmount } = render(<SyncProvider syncManager={syncManager} userId="u1" />)

    unmount()
    window.dispatchEvent(new Event('pagehide'))

    expect(syncManager.stop).toHaveBeenCalled()
    expect(syncManager.flush).not.toHaveBeenCalled()
  })

  it('asks the browser to keep the local database', () => {
    const persist = vi.fn().mockResolvedValue(true)
    Object.defineProperty(navigator, 'storage', { value: { persist }, configurable: true })

    render(<SyncProvider syncManager={controller()} userId="u1" />)

    expect(persist).toHaveBeenCalled()
  })
})
