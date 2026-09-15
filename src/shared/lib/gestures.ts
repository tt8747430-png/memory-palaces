const OVERSHOOT_RUBBER = 0.35
const WRONG_WAY_RUBBER = 0.12
const OPEN_FRACTION = 0.5

export function wasCanceled(event: Event | undefined): boolean {
  return event?.type === 'pointercancel' || event?.type === 'touchcancel'
}

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
  distance: number
  speed: number
}

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

export interface Throw {
  axis: ThrowAxis
  sign: -1 | 1
}

export interface ThrowInput {
  movement: readonly [number, number]
  velocity: readonly [number, number]
  direction: readonly [number, number]
  lockedTo?: ThrowAxis
}

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
