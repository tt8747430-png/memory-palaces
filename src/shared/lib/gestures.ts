const OVERSHOOT_RUBBER = 0.35
const WRONG_WAY_RUBBER = 0.12
const OPEN_FRACTION = 0.5

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
