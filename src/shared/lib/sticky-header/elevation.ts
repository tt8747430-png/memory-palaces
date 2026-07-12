const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

export function barElevation(y: number, distance: number): number {
  return clamp01(y / distance)
}
