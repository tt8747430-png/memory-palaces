import { useEffect, useEffectEvent } from 'react'

/** After the last local write: ten edits to one document are one cycle. */
export const WRITE_DEBOUNCE_MS = 4000
/** After the cloud is heard to move: a burst of another device's writes is one pull. */
export const CLOUD_DEBOUNCE_MS = 3000

/**
 * Runs `fire` once `delay` after `key` last changed while `armed` — a newer change restarts the
 * wait, and disarming cancels it. `fire` is read when the wait ends, never as a dependency.
 *
 * Both cadences settle the same way, so both wait the same way.
 */
export function useQuietFire(armed: boolean, key: unknown, delay: number, fire: () => void): void {
  const onQuiet = useEffectEvent(fire)
  useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => onQuiet(), delay)
    return () => clearTimeout(id)
  }, [armed, key, delay])
}

/**
 * Runs `fire` on the page events that mean "now would be a good time": coming back online, leaving
 * or returning to the app, and the page being hidden. One listener set, shared by both cadences —
 * two copies would mean two live `visibilitychange` listeners doing the same thing.
 */
export function usePageEventFire(armed: boolean, fire: () => void): void {
  const onPageEvent = useEffectEvent(fire)
  useEffect(() => {
    if (!armed) return
    const trigger = () => onPageEvent()
    window.addEventListener('online', trigger)
    document.addEventListener('visibilitychange', trigger)
    window.addEventListener('pagehide', trigger)
    return () => {
      window.removeEventListener('online', trigger)
      document.removeEventListener('visibilitychange', trigger)
      window.removeEventListener('pagehide', trigger)
    }
  }, [armed])
}
