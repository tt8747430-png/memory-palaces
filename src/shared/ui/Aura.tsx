import { motion, useReducedMotion } from 'motion/react'
import { EASE_EXPO } from '@/shared/lib'

const AURA_BG =
  'radial-gradient(circle at center, oklch(var(--p-tint-sky) / 0.45), transparent 60%)'

const CLASS =
  'pointer-events-none absolute left-1/2 top-1/2 size-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl'

/** The sky-tinted bloom behind the threshold on the splash and welcome screens. */
export function Aura() {
  const reduce = useReducedMotion()
  if (reduce) return <div aria-hidden className={CLASS} style={{ background: AURA_BG }} />
  return (
    <motion.div
      aria-hidden
      className={CLASS}
      style={{ background: AURA_BG }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: EASE_EXPO }}
    />
  )
}
