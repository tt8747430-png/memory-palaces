import type { Palace } from './types'
import type { PalaceState } from './store'

/** Read surface for palace state. Each returns a stable reference/primitive so
 * `usePalaceStore(selector)` re-renders only when the selected value changes. */
export const selectPalaces = (state: PalaceState): Palace[] => state.palaces
export const selectPalaceCount = (state: PalaceState): number => state.palaces.length
export const selectIsReady = (state: PalaceState): boolean => state.status === 'ready'
