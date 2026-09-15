import { type Context, createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { StoreApi } from 'zustand/vanilla'

export interface StoreContext<State> {
  StoreContext: Context<StoreApi<State> | null>
  useSelector: <T>(selector: (state: State) => T) => T
  useStoreApi: () => StoreApi<State>
  useStoreApiOptional: () => StoreApi<State> | null
}

export function createStoreContext<State>(name: string): StoreContext<State> {
  const StoreContext = createContext<StoreApi<State> | null>(null)

  function useStoreApi(): StoreApi<State> {
    const store = useContext(StoreContext)
    if (!store) {
      throw new Error(`${name} store missing — render inside <${name}StoreContext value={…}>`)
    }
    return store
  }

  function useStoreApiOptional(): StoreApi<State> | null {
    return useContext(StoreContext)
  }

  function useSelector<T>(selector: (state: State) => T): T {
    return useStore(useStoreApi(), selector)
  }

  return { StoreContext, useSelector, useStoreApi, useStoreApiOptional }
}
