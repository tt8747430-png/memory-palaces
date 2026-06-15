import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Unsubscribe } from '@/shared/api'
import type { RoomRepository } from '../api/room-repository'
import type { Room } from './types'

export type RoomStatus = 'idle' | 'loading' | 'ready'

export interface RoomState {
  rooms: Room[]
  status: RoomStatus
  /** Subscribe to the repository's reactive stream (idempotent); keeps `rooms` live. */
  start: () => void
  /** End the reactive subscription. */
  stop: () => void
  save: (room: Room) => Promise<Room>
  remove: (id: string) => Promise<void>
}

export type RoomStore = StoreApi<RoomState>

const byOrder = (a: Room, b: Room): number => a.order - b.order

/**
 * Store FACTORY (repository INJECTED) — the room twin of the palace store. Holds
 * every room across palaces, sorted by `order`; consumers narrow to one palace via
 * `roomsForPalace`. Reactive: mutations persist through the port and the
 * subscription updates state (RxDB stays the single source of truth).
 */
export function createRoomStore(repo: RoomRepository): RoomStore {
  let unsubscribe: Unsubscribe | null = null
  return createStore<RoomState>((set) => ({
    rooms: [],
    status: 'idle',

    start() {
      if (unsubscribe) return
      set({ status: 'loading' })
      unsubscribe = repo.observe((rooms) => {
        set({ rooms: [...rooms].sort(byOrder), status: 'ready' })
      })
    },

    stop() {
      unsubscribe?.()
      unsubscribe = null
    },

    save(room) {
      return repo.save(room)
    },

    async remove(id) {
      await repo.remove(id)
    },
  }))
}
