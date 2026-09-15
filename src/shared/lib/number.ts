export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value))
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

export function percentOf(value: number, total: number): number {
  return Math.round(clamp01(total === 0 ? 0 : value / total) * 100)
}
