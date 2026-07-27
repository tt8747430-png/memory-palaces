import { useEffect } from 'react'
import { startKeyboardViewport } from './keyboard-viewport'

export function useKeyboardInset() {
  useEffect(() => startKeyboardViewport(), [])
}
