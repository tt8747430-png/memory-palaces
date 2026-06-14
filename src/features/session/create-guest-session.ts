import { makeGuestSession, type SessionStore } from '@/entities/session'

/**
 * Command — ensure a guest session exists. Idempotent: if one is already persisted
 * it is kept. This is the single write-path for guest sign-in; the UI (and later the
 * AI Tutor, via the command registry) reuse it rather than touching the store directly.
 */
export async function createGuestSession(store: SessionStore): Promise<void> {
  await store.getState().load()
  if (store.getState().session) return
  const guest = makeGuestSession(crypto.randomUUID(), new Date().toISOString())
  await store.getState().set(guest)
}
