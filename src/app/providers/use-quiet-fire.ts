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
