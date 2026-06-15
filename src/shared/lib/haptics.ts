/**
 * Haptic feedback via the Vibration API, a no-op where unsupported (desktop, iOS
 * Safari, tests). Three intents: `tick` for light nudges, `impact` for commits,
 * `success` for a finished session. A module flag lets the user preference turn
 * it off app-wide (synced from the preferences store at the composition root).
 */
let enabled = true

/** Enable/disable haptics globally — mirrors the user's `haptics` preference. */
export function setHapticsEnabled(value: boolean): void {
  enabled = value
}

function vibrate(pattern: number | number[]): void {
  if (!enabled) return
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern)
  }
}

export const tick = (): void => vibrate(8)
export const impact = (): void => vibrate(16)
export const success = (): void => vibrate([12, 40, 24])
