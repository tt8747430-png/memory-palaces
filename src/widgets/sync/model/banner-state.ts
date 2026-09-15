import type { SyncPhase } from '@/shared/lib'

export type SyncBannerTone = 'info' | 'warning' | 'success' | 'danger'

/** The eight visible states, as the leaf of a `sync.banner.*` key. */
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
  /** Decks, folders, cards and questions only — the collections that record pending changes. */
  pendingCount: number
  cloudChanged: boolean
  online: boolean
}

export interface SyncBannerView {
  tone: SyncBannerTone
  /** The line, as the leaf of an i18n key under `sync.banner`. */
  message: SyncBannerMessage
  count: number
  action: 'sync' | 'retry' | null
  /** A Sync is in flight: the row shows progress and offers nothing to press. */
  busy: boolean
  /** Offline with work waiting — the banner states the count and then keeps quiet. */
  muted: boolean
}

/**
 * What the banner shows, as one pure decision.
 *
 * The spec's ten states: eight it can show, plus two ways to be hidden — nothing pending with the
 * cloud unchanged, and offline with nothing waiting — all decided here rather than spread across
 * the component's JSX, which is what makes "hidden" reliably hidden rather than an empty strip.
 *
 * `null` means hidden. The component adds the remaining two hidden cases this function cannot see:
 * a guest identity, and no Supabase project at all.
 */
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
    // Nothing to say offline with nothing waiting: being offline is the normal case, not an event.
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
