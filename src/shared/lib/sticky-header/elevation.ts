/**
 * Pure scroll → elevation map for the single persistent header bar. The bar is one
 * layer (no separate collapsed bar): transparent and seamless at the top, gaining a
 * glass background + hairline edge as the page scrolls under it. Kept separate from the
 * motion hook so the interpolation is unit-testable. `y` is the scroll offset in px;
 * `distance` is how far the bar takes to reach full elevation.
 */
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

/** Bar background/edge fades in 0 → 1 across [0, distance] px of scroll. */
export function barElevation(y: number, distance: number): number {
  return clamp01(y / distance)
}
