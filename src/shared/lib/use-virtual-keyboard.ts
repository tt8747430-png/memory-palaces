import { useSyncExternalStore } from 'react'
import { keyboardHeight, subscribeKeyboardHeight } from './keyboard-viewport'

export interface VirtualKeyboard {
  open: boolean
  height: number
}

export function useVirtualKeyboard(): VirtualKeyboard {
  const height = useSyncExternalStore(subscribeKeyboardHeight, keyboardHeight, () => 0)
  return { open: height > 0, height }
}
