export type DropZone = 'before' | 'nest' | 'after'

export interface DropIntent {
  targetId: string
  zone: DropZone
}

export interface ZoneRect {
  top: number
  height: number
}

const EDGE = 0.28

export function dropZone(pointerY: number, rect: ZoneRect, nestable = true): DropZone {
  if (rect.height <= 0) return nestable ? 'nest' : 'before'
  const ratio = Math.min(1, Math.max(0, (pointerY - rect.top) / rect.height))
  if (!nestable) return ratio < 0.5 ? 'before' : 'after'
  if (ratio < EDGE) return 'before'
  if (ratio > 1 - EDGE) return 'after'
  return 'nest'
}
