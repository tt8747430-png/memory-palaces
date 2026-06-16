/**
 * Pure geometry for the touch gestures (swipe-to-delete, pull-to-refresh), kept free
 * of React/DOM so the thresholds are unit-testable without driving real pointer
 * events. `@use-gesture` reports `movement` as a signed offset and `velocity` as a
 * non-negative speed; these helpers take those raw numbers and answer "how far does
 * the element move?" and "did the user commit?".
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

/** Pull (px) the home feed must clear, down, to trigger a refresh. */
export const PULL_REFRESH_THRESHOLD = 64
/** Hard cap on the elastic pull distance. */
export const PULL_REFRESH_MAX = 96

/** Diminishing-returns resistance so the pull feels elastic, capped at `max`. Only a
 * downward pull (positive) produces distance. */
export function pullDistance(dy: number, max: number = PULL_REFRESH_MAX): number {
  if (dy <= 0) return 0
  return Math.min(max, dy * 0.5)
}

/** True once the (already resisted) pull distance clears the trigger threshold. */
export function shouldRefresh(distance: number, threshold: number = PULL_REFRESH_THRESHOLD): boolean {
  return distance >= threshold
}
