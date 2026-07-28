import { EASE_EXPO } from '@/shared/lib'
export const DEPTH_POSE = [
  { scale: 1, y: 0, opacity: 1 },
  { scale: 0.95, y: 14, opacity: 1 },
  { scale: 0.9, y: 26, opacity: 0.72 },
] as const

export const poseAt = (depth: number) => DEPTH_POSE[Math.min(depth, DEPTH_POSE.length - 1)]!

export const PROMOTION = { duration: 0.3, ease: EASE_EXPO } as const

export const STACK_DEPTH = 2
