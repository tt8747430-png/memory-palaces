/**
 * Pure geometry for the swipe-to-delete gesture, kept free of React/DOM so the
 * thresholds are unit-testable without driving real pointer events. `@use-gesture`
 * reports `movement` as a signed offset and `velocity` as a non-negative speed; these
 * helpers take those raw numbers and answer "how far does the row move?" and "did the
 * user commit?".
 */

/** Travel (px) a row must clear, left, to commit a delete. */
export const SWIPE_DELETE_THRESHOLD = 96
/** Hard cap on how far a row can be dragged left (the reveal width). */
export const SWIPE_DELETE_MAX = 124
/** Fling speed (px/ms) that commits regardless of distance. */
export const SWIPE_FLING_SPEED = 0.5

/** Cap leftward travel at the reveal width and rubber-band any rightward pull so the
 * row can't be dragged the wrong way. */
export function clampSwipeOffset(offsetX: number, max: number = SWIPE_DELETE_MAX): number {
  if (offsetX >= 0) return offsetX * 0.18
  return Math.max(offsetX, -max)
}

/** Commit the delete when the row was dragged left past the threshold, or flung left
 * fast. A rightward or too-short drag never commits. */
export function shouldCommitSwipe(
  offsetX: number,
  speedX: number,
  threshold: number = SWIPE_DELETE_THRESHOLD,
  fling: number = SWIPE_FLING_SPEED,
): boolean {
  if (offsetX >= 0) return false
  return -offsetX >= threshold || speedX >= fling
}
