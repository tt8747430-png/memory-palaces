const OVERSHOOT_RUBBER = 0.35
const WRONG_WAY_RUBBER = 0.12
const OPEN_FRACTION = 0.5

/**
 * A gesture the platform took away is not a gesture the learner finished. `@use-gesture` routes a
 * `pointercancel`/`touchcancel` through the same release path as a lift, so the only thing telling
 * a committed swipe from one interrupted by a scroll takeover, an incoming call or the app going
 * to the background is the event that ended it. Every surface asks this before acting on a release
 * — acting on a cancelled one is how a row deletes a card nobody swiped.
 */
export function wasCanceled(event: Event | undefined): boolean {
  return event?.type === 'pointercancel' || event?.type === 'touchcancel'
}

/**
 * What one frame of a drag is asking the surface to decide. Every swipe surface classified this for
 * itself, and the one that forgot `canceled` fired its action on a gesture nobody finished — so the
 * four cases are named once and each surface switches on them.
 */
export type DragFrame = 'tap' | 'canceled' | 'released' | 'moving'

export function dragFrame({
  tap,
  last,
  event,
}: {
  tap: boolean
  last: boolean
  event: Event | undefined
}): DragFrame {
  if (tap) return 'tap'
  if (!last) return 'moving'
  return wasCanceled(event) ? 'canceled' : 'released'
}

export interface FlingThresholds {
  /** Travel past which the throw counts however slowly it was made. */
  distance: number
  /** Speed past which a short throw still counts, in px/ms. */
  speed: number
}

/**
 * Which way a released drag was going along one axis: `-1`, `1`, or `0` for a drag that was neither
 * far enough nor fast enough to be a throw.
 *
 * Per axis, and deliberately: `@use-gesture` reports velocity unsigned, so a card asking whether
 * "the fastest axis" cleared the bar commits a horizontal throw off a fast vertical flick. Each
 * axis is resolved from its own distance, its own speed and its own direction, and the caller
 * decides which of the two won.
 */
export function resolveFling(
  movement: number,
  velocity: number,
  direction: number,
  { distance, speed }: FlingThresholds,
): -1 | 0 | 1 {
  if (movement <= -distance) return -1
  if (movement >= distance) return 1
  if (velocity < speed || direction === 0) return 0
  return direction < 0 ? -1 : 1
}

export type ThrowAxis = 'x' | 'y'

/** A throw the surface has to act on: which axis carried it, and which way along that axis. */
export interface Throw {
  axis: ThrowAxis
  sign: -1 | 1
}

export interface ThrowInput {
  movement: readonly [number, number]
  velocity: readonly [number, number]
  direction: readonly [number, number]
  /**
   * Set when the surface only moves on one axis — a card over a scroller can be swiped sideways but
   * not up. The other axis is then not a throw the surface could act on, but it is still evidence:
   * a drag that wandered further across the locked axis than along it is the scroll it looks like.
   * Drop that test and reading a long answer with a little sideways drift grades the card.
   */
  lockedTo?: ThrowAxis
}

/** Which way a two-axis drag was thrown, or `null` for one that was no throw at all. */
export function resolveThrow(
  { movement, velocity, direction, lockedTo }: ThrowInput,
  thresholds: FlingThresholds,
): Throw | null {
  const [mx, my] = movement
  const along = Math.abs(mx)
  const across = Math.abs(my)
  const x = lockedTo === 'y' ? 0 : resolveFling(mx, velocity[0], direction[0], thresholds)
  const y = lockedTo === 'x' ? 0 : resolveFling(my, velocity[1], direction[1], thresholds)

  if (lockedTo === 'x') return x && along >= across ? { axis: 'x', sign: x } : null
  if (lockedTo === 'y') return y && across >= along ? { axis: 'y', sign: y } : null
  // Both axes threw: the surface goes where the finger went furthest. A tie stays on `x`, where the
  // swipes a learner makes a hundred times a day live.
  if (x && (!y || along >= across)) return { axis: 'x', sign: x }
  if (y) return { axis: 'y', sign: y }
  return null
}

export interface SwipeGeometry {
  hasLeading: boolean
  hasTrailing: boolean
  leadingWidth: number
  trailingWidth: number
  leadingCommit: number
  trailingCommit: number
}

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
