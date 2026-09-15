import { describe, expect, it } from 'vitest'
import { bannerView, type SyncBannerInput } from './banner-state'

const base: SyncBannerInput = {
  phase: 'idle',
  pendingCount: 0,
  cloudChanged: false,
  online: true,
}

const view = (overrides: Partial<SyncBannerInput> = {}) => bannerView({ ...base, ...overrides })

describe('bannerView', () => {
  it('hides when nothing is pending and the cloud has not moved', () => {
    expect(view()).toBeNull()
  })

  it('hides offline with nothing waiting — being offline is not an event', () => {
    expect(view({ online: false })).toBeNull()
  })

  it('warns, with Synchronise, when changes are waiting', () => {
    expect(view({ pendingCount: 3 })).toMatchObject({
      tone: 'warning',
      message: 'pending',
      count: 3,
      action: 'sync',
    })
  })

  it('informs, with Synchronise, when only the cloud moved', () => {
    expect(view({ cloudChanged: true })).toMatchObject({
      tone: 'info',
      message: 'cloudChanged',
      action: 'sync',
    })
  })

  it('warns when both sides moved', () => {
    expect(view({ pendingCount: 2, cloudChanged: true })).toMatchObject({
      tone: 'warning',
      message: 'pendingAndCloud',
      action: 'sync',
    })
  })

  it('states the count and offers nothing offline', () => {
    expect(view({ online: false, pendingCount: 4 })).toMatchObject({
      tone: 'warning',
      message: 'offline',
      count: 4,
      action: null,
      muted: true,
    })
  })

  it('shows progress while syncing and offers nothing to press', () => {
    expect(view({ phase: 'syncing', pendingCount: 2 })).toMatchObject({
      tone: 'info',
      message: 'syncing',
      action: null,
      busy: true,
    })
  })

  it('shows progress while restoring after a cancelled deletion', () => {
    expect(view({ phase: 'restoring' })).toMatchObject({
      tone: 'info',
      message: 'restoring',
      busy: true,
    })
  })

  it('reports success, so the press is acknowledged', () => {
    expect(view({ phase: 'synced' })).toMatchObject({ tone: 'success', message: 'synced' })
  })

  it('offers Retry when a Sync failed', () => {
    expect(view({ phase: 'failed', pendingCount: 1 })).toMatchObject({
      tone: 'danger',
      message: 'failed',
      action: 'retry',
    })
  })

  it('keeps the in-flight phases visible offline — the attempt is already under way', () => {
    expect(view({ phase: 'syncing', online: false })).toMatchObject({ message: 'syncing' })
    expect(view({ phase: 'failed', online: false })).toMatchObject({ message: 'failed' })
  })
})
