export const SWIPE_DELETE_THRESHOLD = 96
export const SWIPE_DELETE_MAX = 124
export const SWIPE_FLING_SPEED = 0.5

export function clampSwipeOffset(offsetX: number, max: number = SWIPE_DELETE_MAX): number {
  if (offsetX >= 0) return offsetX * 0.18
  return Math.max(offsetX, -max)
}

export function shouldCommitSwipe(
  offsetX: number,
  speedX: number,
  threshold: number = SWIPE_DELETE_THRESHOLD,
  fling: number = SWIPE_FLING_SPEED,
): boolean {
  if (offsetX >= 0) return false
  return -offsetX >= threshold || speedX >= fling
}
