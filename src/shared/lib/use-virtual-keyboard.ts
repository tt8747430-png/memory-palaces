import { useSyncExternalStore } from 'react'
import { keyboardHeight, subscribeKeyboard } from './keyboard-viewport'

export interface VirtualKeyboard {
  open: boolean
  height: number
}

export function useVirtualKeyboard(): VirtualKeyboard {
  const height = useSyncExternalStore(subscribeKeyboard, keyboardHeight, () => 0)
  return { open: height > 0, height }
}
