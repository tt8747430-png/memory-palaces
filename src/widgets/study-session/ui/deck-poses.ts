/**
 * Where each card in the deck sits. Depth 0 is the card in play; the rest are stepped back and
 * down so the stack has a readable edge without the pile ever looking like a fan of paper.
 */
export const DEPTH_POSE = [
  { scale: 1, y: 0, opacity: 1 },
  { scale: 0.95, y: 14, opacity: 1 },
  { scale: 0.9, y: 26, opacity: 0.72 },
] as const

/** The pose one step further back than `depth`, clamped to the deepest one drawn. */
export const poseAt = (depth: number) => DEPTH_POSE[Math.min(depth, DEPTH_POSE.length - 1)]!

/** Fast enough to feel like the same gesture, slow enough to see the card arrive. */
export const PROMOTION = { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as const

/** Two cards of depth is all the stack can show — any more is hidden behind the two in front. */
export const STACK_DEPTH = 2
