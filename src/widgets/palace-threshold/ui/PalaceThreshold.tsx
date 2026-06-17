import { motion, useReducedMotion, type Variants } from 'motion/react'
import { cn } from '@/shared/lib'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.1 } },
}

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
}

const locus: Variants = {
  hidden: { r: 0, opacity: 0 },
  show: { r: 7, opacity: 1, transition: { type: 'spring', stiffness: 220, damping: 16 } },
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
}

/**
 * The brand's entry motif: blueprint light-lines draw a temple/threshold, then a
 * single locus ignites at its heart — "stepping into your memory palace". Pure SVG
 * pathLength + motion (60fps, no deps); reduced motion renders the final frame.
 */
export function PalaceThreshold({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={cn('text-secondary', className)}
      style={{ filter: 'drop-shadow(0 0 12px oklch(83.2% 0.083 264.3 / 0.55))' }}
      role="img"
      aria-label="Mindscape"
      variants={container}
      initial={reduce ? 'show' : 'hidden'}
      animate="show"
    >
      {/* pediment / roof */}
      <motion.path variants={draw} d="M40 64 L100 24 L160 64" {...stroke} />
      {/* lintel */}
      <motion.line variants={draw} x1="46" y1="64" x2="154" y2="64" {...stroke} />
      {/* columns */}
      <motion.line variants={draw} x1="64" y1="64" x2="64" y2="166" {...stroke} />
      <motion.line variants={draw} x1="136" y1="64" x2="136" y2="166" {...stroke} />
      {/* arched doorway */}
      <motion.path variants={draw} d="M86 166 L86 126 A14 14 0 0 1 114 126 L114 166" {...stroke} />
      {/* steps */}
      <motion.line variants={draw} x1="40" y1="166" x2="160" y2="166" {...stroke} />
      <motion.line variants={draw} x1="28" y1="178" x2="172" y2="178" {...stroke} />
      {/* the locus igniting in the doorway */}
      <motion.circle variants={locus} cx="100" cy="138" r="7" fill="white" />
    </motion.svg>
  )
}
