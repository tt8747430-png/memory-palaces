import { useEffect } from 'react'
import { Observable } from '@/shared/data/observable'

const hidden = new Observable(false)

/** Whether a surface has asked the tab nav to stand down. */
export const tabNavHidden = hidden.asReadonly()

/**
 * Hides the tab nav for as long as `on` holds.
 *
 * The nav hides itself on any non-tab route, which covers most of the app. This exists for
 * the drill-downs that are *state* rather than a route — opening a folder keeps the library
 * at `/`, so route matching alone would leave the nav up on a screen that is no longer a
 * tab. Those screens carry their own back affordance, and the tab bar competes with it.
 */
export function useHideTabNav(on: boolean): void {
  useEffect(() => {
    hidden.set(on)
    return () => hidden.set(false)
  }, [on])
}
