import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { RoomState, RoomStore } from './store'

/** Injection point: the app provides its composition-root store via this context. */
export const RoomStoreContext = createContext<RoomStore | null>(null)

function useRoomStoreContext(): RoomStore {
  const store = useContext(RoomStoreContext)
  if (!store) {
    throw new Error('Room store missing — render inside <RoomStoreContext value={…}>')
  }
  return store
}

/** Reactive, selector-scoped read of room state. */
export function useRoomStore<T>(selector: (state: RoomState) => T): T {
  return useStore(useRoomStoreContext(), selector)
}

/** Imperative handle to the store (for commands that write). */
export function useRoomStoreApi(): RoomStore {
  return useRoomStoreContext()
}
