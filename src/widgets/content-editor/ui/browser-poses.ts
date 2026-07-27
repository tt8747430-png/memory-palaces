export const DEPTH_POSE = [
  { scale: 1, y: 0, x: 0, opacity: 1 },
  { scale: 0.94, y: 16, x: 0, opacity: 1 },
  { scale: 0.88, y: 30, x: 0, opacity: 0.7 },
] as const

export const poseAt = (depth: number) => DEPTH_POSE[Math.min(depth, DEPTH_POSE.length - 1)]!

export const CARD_EASE = [0.16, 1, 0.3, 1] as const
export const SPRING = { type: 'spring', stiffness: 500, damping: 36 } as const

export const STACK_DEPTH = 2
