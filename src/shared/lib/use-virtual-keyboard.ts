import { useSyncExternalStore } from 'react'
import { keyboardHeight, keyboardOpen, subscribeKeyboardHeight } from './keyboard-viewport'

export interface VirtualKeyboard {
  open: boolean
  height: number
}

export function useVirtualKeyboard(): VirtualKeyboard {
  const height = useSyncExternalStore(subscribeKeyboardHeight, keyboardHeight, () => 0)
  const open = useSyncExternalStore(subscribeKeyboardHeight, keyboardOpen, () => false)
  return { open, height }
}
