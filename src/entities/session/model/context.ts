import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { SessionState, SessionStore } from './store'

/** Injection point: the app provides its composition-root store via this context. */
export const SessionStoreContext = createContext<SessionStore | null>(null)

function useSessionStoreContext(): SessionStore {
  const store = useContext(SessionStoreContext)
  if (!store) {
    throw new Error('Session store missing — render inside <SessionStoreContext value={…}>')
  }
  return store
}

/** Reactive, selector-scoped read of session state. */
export function useSessionStore<T>(selector: (state: SessionState) => T): T {
  return useStore(useSessionStoreContext(), selector)
}

/** Imperative handle to the store (for commands that write). */
export function useSessionStoreApi(): SessionStore {
  return useSessionStoreContext()
}
