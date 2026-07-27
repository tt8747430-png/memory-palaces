/**
 * Where each card in the browser's stack sits. Depth 0 is the card in play; the rest step back
 * and down so the deck has a readable edge. Going forward, the next card animates from depth 1
 * to depth 0 — it rises out of the stack it was already part of instead of sliding in.
 */
export const DEPTH_POSE = [
  { scale: 1, y: 0, x: 0, opacity: 1 },
  { scale: 0.94, y: 16, x: 0, opacity: 1 },
  { scale: 0.88, y: 30, x: 0, opacity: 0.7 },
] as const

export const poseAt = (depth: number) => DEPTH_POSE[Math.min(depth, DEPTH_POSE.length - 1)]!

export const CARD_EASE = [0.16, 1, 0.3, 1] as const
export const SPRING = { type: 'spring', stiffness: 500, damping: 36 } as const

/** How many cards deep the stack is drawn. Beyond this nothing is visible anyway. */
export const STACK_DEPTH = 2
