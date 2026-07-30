/** Pins `value` into `[lo, hi]`. */
export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value))
}

/** Pins `value` into `[0, 1]` — the unit range progress and elevation live in. */
export function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

/** A `0..1` fraction as a whole percent, pinned to the bar's range. */
export function percentOf(value: number, total: number): number {
  return Math.round(clamp01(total === 0 ? 0 : value / total) * 100)
}
