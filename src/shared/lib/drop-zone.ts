/** Where a dragged row would land relative to the row it is hovering. */
export type DropZone = 'before' | 'nest' | 'after'

export interface DropIntent {
  targetId: string
  zone: DropZone
}

export interface ZoneRect {
  top: number
  height: number
}

/**
 * The share of a row, top and bottom, that reads as "between rows" rather than
 * "into this row". A generous middle is deliberate: nesting is the gesture the
 * tree exists for, and aiming at a 6px seam with a thumb is not a design.
 */
const EDGE = 0.28

/**
 * Split a hovered row into drop zones: the middle band drops *into* the row, the
 * top and bottom edges drop *between* rows. This is the whole disambiguation —
 * where the finger is says what the drop means, so nothing is hidden in a
 * modifier gesture.
 *
 * `nestable` false (a folder over a folder — folders don't hold folders) gives
 * up the middle band and splits the row in half, so every hover still resolves.
 */
export function dropZone(pointerY: number, rect: ZoneRect, nestable = true): DropZone {
  if (rect.height <= 0) return nestable ? 'nest' : 'before'
  const ratio = Math.min(1, Math.max(0, (pointerY - rect.top) / rect.height))
  if (!nestable) return ratio < 0.5 ? 'before' : 'after'
  if (ratio < EDGE) return 'before'
  if (ratio > 1 - EDGE) return 'after'
  return 'nest'
}
