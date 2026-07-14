let enabled = true

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
