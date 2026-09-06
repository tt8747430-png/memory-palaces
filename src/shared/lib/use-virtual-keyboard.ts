import { useSyncExternalStore } from 'react'
import { keyboardHeight, keyboardOpen, subscribeKeyboardHeight } from './keyboard-viewport'

export interface VirtualKeyboard {
  /** Is a keyboard up. Not `height > 0` — see `keyboardOpen`. */
  open: boolean
  /** How much of the shell's bottom it covers, the pan already taken out. Can be 0 while open. */
  height: number
}

/**
 * Two subscriptions, not one snapshot object: `useSyncExternalStore` compares snapshots by
 * identity, so a `getSnapshot` returning a fresh `{ open, height }` would re-render forever. Both
 * halves come off the same subscribe, which fires whenever either moves.
 */
export function useVirtualKeyboard(): VirtualKeyboard {
  const height = useSyncExternalStore(subscribeKeyboardHeight, keyboardHeight, () => 0)
  const open = useSyncExternalStore(subscribeKeyboardHeight, keyboardOpen, () => false)
  return { open, height }
}
