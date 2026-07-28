type Bezier = [number, number, number, number]

/** The app's two easing curves. Anything that moves uses one of them. */
export const EASE_OUT: Bezier = [0.22, 1, 0.36, 1]
export const EASE_EXPO: Bezier = [0.16, 1, 0.3, 1]

/** CSS forms, for transitions declared outside Motion. */
export const EASE_OUT_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)'

export const authEntrance = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: EASE_EXPO },
}
