import { useSyncExternalStore } from 'react'
import { keyboardHeight, keyboardOpen, subscribeKeyboardHeight } from './keyboard-viewport'

export interface VirtualKeyboard {
  open: boolean
  height: number
}

/**
 * Whether a keyboard is up, and nothing else. The height changes several times per episode — the
 * accessory bar, a predictive strip, the dismiss animation — and a caller that only needs to know
 * *whether* would re-render for every one of them. `useSyncExternalStore` bails on an unchanged
 * snapshot, so subscribing to the boolean costs one render per episode instead.
 */
export function useKeyboardOpen(): boolean {
  return useSyncExternalStore(subscribeKeyboardHeight, keyboardOpen, () => false)
}

/** The same measurement with the height too, for the callers that reserve room by it. */
export function useVirtualKeyboard(): VirtualKeyboard {
  const height = useSyncExternalStore(subscribeKeyboardHeight, keyboardHeight, () => 0)
  return { open: useKeyboardOpen(), height }
}
