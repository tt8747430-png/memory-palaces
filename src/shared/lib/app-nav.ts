import { useEffect } from 'react'
import { create } from 'zustand'

interface AppNavState {
  /**
   * How many surfaces currently want the tab bar gone. A count rather than a flag so two
   * overlapping requests (a page entering select mode while a sheet is closing) can't leave
   * the bar hidden after the first one releases it.
   */
  suppressions: number
  suppress: () => void
  release: () => void
}

const useAppNavStore = create<AppNavState>((set) => ({
  suppressions: 0,
  suppress: () => set((state) => ({ suppressions: state.suppressions + 1 })),
  release: () => set((state) => ({ suppressions: Math.max(0, state.suppressions - 1) })),
}))

/**
 * Hides the tab bar for as long as `active` holds. Multi-select owns the bottom edge — its
 * toolbar sits exactly where the tab bar does, and navigating away mid-selection would drop
 * the selection anyway — so the bar steps aside instead of stacking under the toolbar.
 */
export function useHideAppNav(active: boolean) {
  useEffect(() => {
    if (!active) return
    const { suppress, release } = useAppNavStore.getState()
    suppress()
    return release
  }, [active])
}

/** Whether any surface is currently asking for the tab bar to stay out of the way. */
export function useAppNavHidden(): boolean {
  return useAppNavStore((state) => state.suppressions > 0)
}
