import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { SessionState, SessionStore } from './store'

export const SessionStoreContext = createContext<SessionStore | null>(null)

function useSessionStoreContext(): SessionStore {
  const store = useContext(SessionStoreContext)
  if (!store) {
    throw new Error('Session store missing — render inside <SessionStoreContext value={…}>')
  }
  return store
}

export function useSessionStore<T>(selector: (state: SessionState) => T): T {
  return useStore(useSessionStoreContext(), selector)
}

export function useSessionStoreApi(): SessionStore {
  return useSessionStoreContext()
}
