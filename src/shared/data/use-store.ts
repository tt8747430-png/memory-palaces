import { useSyncExternalStore } from 'react'
import type { ReadonlyObservable } from './observable'

/**
 * Binds a framework-agnostic store observable into React rendering.
 * The store itself knows nothing about React; this is the only seam.
 */
export function useStore<T>(observable: ReadonlyObservable<T>): T {
  return useSyncExternalStore(observable.subscribe, observable.get, observable.get)
}
