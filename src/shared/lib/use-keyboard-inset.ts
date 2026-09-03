import { useLayoutEffect } from 'react'
import { startKeyboardViewport } from './keyboard-viewport'

/**
 * A layout effect, not an effect: `--app-height` falls back to `100%` until the first measurement,
 * and a percentage of a percentage is indeterminate — anything sizing itself as a *share* of the
 * shell would collapse for a frame. Measuring before the first paint means the shell's height is a
 * real length from the start, so `--app-height` is the one place any screen has to ask (ADR 0002).
 */
export function useKeyboardInset() {
  useLayoutEffect(() => startKeyboardViewport(), [])
}
