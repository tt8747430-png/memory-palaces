import type { SessionKind } from './types'
import type { SessionState } from './store'

export const selectSessionKind = (state: SessionState): SessionKind | null =>
  state.session?.kind ?? null

export const selectAccountId = (state: SessionState): string | null =>
  state.session?.kind === 'account' ? state.session.id : null
