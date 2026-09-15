type Bezier = [number, number, number, number]

export const EASE_OUT: Bezier = [0.22, 1, 0.36, 1]
export const EASE_EXPO: Bezier = [0.16, 1, 0.3, 1]

export const EASE_OUT_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)'

export const authEntrance = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: EASE_EXPO },
}

export const authStagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}

export const authRise = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_EXPO } },
}

export const STACK_DEPTH = 2

export function poseAt<T>(poses: readonly T[], depth: number): T {
  return poses[Math.min(Math.max(depth, 0), poses.length - 1)]!
}
