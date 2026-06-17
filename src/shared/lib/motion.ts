/**
 * Shared in-task entrance for the auth surfaces (login / signup / forgot): a single
 * ≤250ms fade + short rise, no orchestrated load sequence — motion conveys arrival,
 * not spectacle. Reduced motion is handled globally by MotionConfig, so no per-use
 * fallback is needed. Spread onto a `motion` element: `<motion.div {...authEntrance}>`.
 */
export const authEntrance = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}
