/**
 * Haptic feedback via the Vibration API, a no-op where unsupported (desktop, iOS
 * Safari, tests). Three intents: `tick` for light nudges, `impact` for commits,
 * `success` for a finished session.
 */
function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern)
  }
}

export const tick = (): void => vibrate(8)
export const impact = (): void => vibrate(16)
export const success = (): void => vibrate([12, 40, 24])
