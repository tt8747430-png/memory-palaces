type Bezier = [number, number, number, number]

/**
 * The two curves Motion animations use. Two more live as tokens for CSS
 * transitions (`--p-ease-out-quart`, `--p-ease-standard`), and `Sheet` keeps the
 * iOS sheet curve of its own — a full-height surface travelling further reads
 * wrong on these. Reach for one of these first; adding a fifth needs a reason.
 */
export const EASE_OUT: Bezier = [0.22, 1, 0.36, 1]
export const EASE_EXPO: Bezier = [0.16, 1, 0.3, 1]

/** CSS form of `EASE_OUT`, for transitions declared outside Motion. */
export const EASE_OUT_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)'

export const authEntrance = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: EASE_EXPO },
}

/** The auth screens reveal their header, form and footer in sequence. */
export const authStagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}

export const authRise = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_EXPO } },
}

/** How many cards sit behind the front one in a stack. */
export const STACK_DEPTH = 2

/**
 * The pose a card wears `depth` places back in a stack. Depths past the end of
 * the table reuse the deepest pose, so a stack can be asked for one more card
 * than it draws without reaching off the end.
 */
export function poseAt<T>(poses: readonly T[], depth: number): T {
  return poses[Math.min(Math.max(depth, 0), poses.length - 1)]!
}
