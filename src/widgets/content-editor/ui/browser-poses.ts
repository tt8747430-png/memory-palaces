import { EASE_EXPO } from '@/shared/lib'
export const DEPTH_POSE = [
  { scale: 1, y: 0, x: 0, opacity: 1 },
  { scale: 0.94, y: 16, x: 0, opacity: 1 },
  { scale: 0.88, y: 30, x: 0, opacity: 0.7 },
] as const

export const CARD_EASE = EASE_EXPO
export const SPRING = { type: 'spring', stiffness: 500, damping: 36 } as const
