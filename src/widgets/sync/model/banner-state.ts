import type { SyncPhase } from '@/shared/lib'

export type SyncBannerTone = 'info' | 'warning' | 'success' | 'danger'

export type SyncBannerMessage =
  | 'restoring'
  | 'syncing'
  | 'synced'
  | 'failed'
  | 'offline'
  | 'pendingAndCloud'
  | 'pending'
  | 'cloudChanged'

export interface SyncBannerInput {
  phase: SyncPhase
  pendingCount: number
  cloudChanged: boolean
  online: boolean
}

export interface SyncBannerView {
  tone: SyncBannerTone
  message: SyncBannerMessage
  count: number
  action: 'sync' | 'retry' | null
  busy: boolean
  muted: boolean
}

export function bannerView(input: SyncBannerInput): SyncBannerView | null {
  const base = { count: input.pendingCount, action: null, busy: false, muted: false } as const

  if (input.phase === 'restoring') {
    return { ...base, tone: 'info', message: 'restoring', busy: true }
  }
  if (input.phase === 'syncing') {
    return { ...base, tone: 'info', message: 'syncing', busy: true }
  }
  if (input.phase === 'synced') {
    return { ...base, tone: 'success', message: 'synced' }
  }
  if (input.phase === 'failed') {
    return { ...base, tone: 'danger', message: 'failed', action: 'retry' }
  }
  if (!input.online) {
    if (!input.pendingCount) return null
    return { ...base, tone: 'warning', message: 'offline', muted: true }
  }
  if (input.pendingCount && input.cloudChanged) {
    return { ...base, tone: 'warning', message: 'pendingAndCloud', action: 'sync' }
  }
  if (input.pendingCount) {
    return { ...base, tone: 'warning', message: 'pending', action: 'sync' }
  }
  if (input.cloudChanged) {
    return { ...base, tone: 'info', message: 'cloudChanged', action: 'sync' }
  }
  return null
}
