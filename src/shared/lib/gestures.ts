// Pure swipe math for `SwipeRow` (the tray-reveal / edge-commit gesture). Kept here, framework-free
// and unit-tested, so the component only owns the recognizer (`@use-gesture`) and the animation.

/** How far the tray keeps travelling past its commit point, and on a wrong-way drag. */
const OVERSHOOT_RUBBER = 0.35
const WRONG_WAY_RUBBER = 0.12
/** A release opens the tray once the drag passes half its reveal width. */
const OPEN_FRACTION = 0.5

export interface SwipeGeometry {
  hasLeading: boolean
  hasTrailing: boolean
  /** Resting width the tray reveals when opened. */
  leadingWidth: number
  trailingWidth: number
  /** Travel that arms, and on release commits, the edge action (reveal width + commit gap). */
  leadingCommit: number
  trailingCommit: number
}

/**
 * Rubber-band a raw cumulative drag offset into the row's travel range: free up to the commit
 * point, resisted past it, and softly damped when dragged against an absent tray.
 */
export function clampSwipeOffset(raw: number, g: SwipeGeometry): number {
  if (raw > 0) {
    if (!g.hasLeading) return raw * WRONG_WAY_RUBBER
    if (raw <= g.leadingCommit) return raw
    return g.leadingCommit + (raw - g.leadingCommit) * OVERSHOOT_RUBBER
  }
  if (raw < 0) {
    if (!g.hasTrailing) return raw * WRONG_WAY_RUBBER
    if (raw >= -g.trailingCommit) return raw
    return -(g.trailingCommit + (-raw - g.trailingCommit) * OVERSHOOT_RUBBER)
  }
  return 0
}

/** Which edge, if any, the current offset has armed — drives the pre-commit haptic + tray scale. */
export function armedSide(offset: number, g: SwipeGeometry): 'leading' | 'trailing' | null {
  if (offset <= -g.trailingCommit && g.hasTrailing) return 'trailing'
  if (offset >= g.leadingCommit && g.hasLeading) return 'leading'
  return null
}

export type SwipeRelease =
  | { kind: 'commit-leading' }
  | { kind: 'commit-trailing' }
  | { kind: 'open-leading'; settleTo: number }
  | { kind: 'open-trailing'; settleTo: number }
  | { kind: 'close'; settleTo: number }

/**
 * Decide what a release does from where the row landed: fire the edge action if it cleared the
 * commit point, otherwise open the tray if it cleared half its width, otherwise snap closed.
 */
export function resolveSwipeRelease(offset: number, g: SwipeGeometry): SwipeRelease {
  if (offset <= -g.trailingCommit && g.hasTrailing) return { kind: 'commit-trailing' }
  if (offset >= g.leadingCommit && g.hasLeading) return { kind: 'commit-leading' }
  if (offset <= -g.trailingWidth * OPEN_FRACTION && g.hasTrailing) {
    return { kind: 'open-trailing', settleTo: -g.trailingWidth }
  }
  if (offset >= g.leadingWidth * OPEN_FRACTION && g.hasLeading) {
    return { kind: 'open-leading', settleTo: g.leadingWidth }
  }
  return { kind: 'close', settleTo: 0 }
}
