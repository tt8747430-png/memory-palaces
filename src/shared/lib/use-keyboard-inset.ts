import { useLayoutEffect } from 'react'
import { startKeyboardViewport } from './keyboard-viewport'

export function useKeyboardInset() {
  useLayoutEffect(() => startKeyboardViewport(), [])
}
