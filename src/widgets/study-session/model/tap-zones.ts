import type { FlashcardSwipeConfig, SwipeDirection, TapZone } from '@/shared/config/flashcard-swipe'

export interface ZoneRect {
  left: number
  top: number
  width: number
  height: number
}

export interface ZonePoint {
  x: number
  y: number
}

/** Fraction of the card's shorter edge a strip would like to be. */
const STRIP_SHARE = 0.18

/** No strip is ever thinner than a fingertip, however small the card gets. */
const MIN_STRIP = 44

/**
 * How wide the four edge strips are on a card of this size.
 *
 * A strip wants 18% of the shorter edge and never less than a fingertip, but it also never takes
 * so much that the centre — where the face's own work happens, revealing a word or typing — is left
 * with under half of either axis. On a card too small to hold both rules, the centre wins.
 */
export function stripWidth(rect: ZoneRect): number {
  const wanted = Math.max(MIN_STRIP, STRIP_SHARE * Math.min(rect.width, rect.height))
  return Math.max(0, Math.min(wanted, rect.width / 4, rect.height / 4))
}

/**
 * Which zone a tap landed in. Corners go to whichever edge is nearer, and a point outside the card
 * belongs to the edge it left through — a tap is resolved against the card that was under it.
 */
export function zoneFor(point: ZonePoint, rect: ZoneRect, strip = stripWidth(rect)): TapZone {
  const edges: { zone: SwipeDirection; distance: number }[] = [
    { zone: 'left', distance: point.x - rect.left },
    { zone: 'right', distance: rect.left + rect.width - point.x },
    { zone: 'up', distance: point.y - rect.top },
    { zone: 'down', distance: rect.top + rect.height - point.y },
  ]

  let nearest = edges[0]!
  for (const edge of edges) {
    if (edge.distance < nearest.distance) nearest = edge
  }
  return nearest.distance <= strip ? nearest.zone : 'centre'
}

export type TapResolution = { kind: 'flip' } | { kind: 'act'; zone: TapZone }

/**
 * What a tap that reached the card's background should do. An edge is always the action it
 * carries. The middle turns a prompt over — that is how the answer is reached, whatever the
 * learner set — and on the revealed side does what the learner set it to, which may be nothing.
 */
export function resolveTap(
  zone: TapZone,
  { showBack, config }: { showBack: boolean; config: FlashcardSwipeConfig },
): TapResolution | null {
  if (zone !== 'centre') return { kind: 'act', zone }
  if (!showBack || config.centre === 'flip') return { kind: 'flip' }
  return config.centre === 'none' ? null : { kind: 'act', zone }
}
