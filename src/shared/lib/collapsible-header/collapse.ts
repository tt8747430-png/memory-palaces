/**
 * Pure scroll → style maps for the collapsible home header (mirrors the old app's
 * `useTransform` ranges). Kept separate from the motion hook so the interpolation is
 * unit-testable. `y` is the viewport scroll offset in px; `distance` is how far the
 * hero takes to fully recede.
 */
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

/** Hero fades 1 → 0 across [0, distance]. */
export function heroOpacity(y: number, distance: number): number {
  return clamp01(1 - y / distance)
}

/** Hero scales 1 → 0.96 (parallax); flat under reduced motion. */
export function heroScale(y: number, distance: number, reduce: boolean): number {
  if (reduce) return 1
  return 1 - clamp01(y / distance) * 0.04
}

/** Hero drifts up 0 → 28px (parallax); flat under reduced motion. */
export function heroY(y: number, distance: number, reduce: boolean): number {
  if (reduce) return 0
  return clamp01(y / distance) * 28
}

/** Compact bar stays hidden until the hero has mostly gone (0.55·distance), then
 * fades in to 1 by `distance`. */
export function compactOpacity(y: number, distance: number): number {
  const start = distance * 0.55
  return clamp01((y - start) / (distance - start))
}

/** Pinned-header height as it collapses: `expanded` (hero) at progress 0 → `collapsed`
 * (compact bar) at progress 1. `progress` is the normalized collapse amount (0…1, e.g.
 * `1 - heroOpacity`). Interpolating an explicit pixel height — rather than a CSS grid
 * `fr` track — keeps the shrink smooth when driven imperatively per scroll frame. */
export function headerHeight(progress: number, expanded: number, collapsed: number): number {
  const p = clamp01(progress)
  return expanded + (collapsed - expanded) * p
}
