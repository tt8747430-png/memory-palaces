import { useEffect } from 'react'
import { create } from 'zustand'

interface AppNavState {
  suppressions: number
  suppress: () => void
  release: () => void
}

const useAppNavStore = create<AppNavState>((set) => ({
  suppressions: 0,
  suppress: () => set((state) => ({ suppressions: state.suppressions + 1 })),
  release: () => set((state) => ({ suppressions: Math.max(0, state.suppressions - 1) })),
}))

export function useHideAppNav(active: boolean) {
  useEffect(() => {
    if (!active) return
    const { suppress, release } = useAppNavStore.getState()
    suppress()
    return release
  }, [active])
}

export function useAppNavHidden(): boolean {
  return useAppNavStore((state) => state.suppressions > 0)
}
