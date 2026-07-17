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

const spark: Variants = {
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

const GLOW = 'drop-shadow(0 0 12px oklch(83.2% 0.083 264.3 / 0.55))'

export interface ThresholdProps {
  className?: string
  tone?: 'dark' | 'light'
  animated?: boolean
}

export function Threshold({ className, tone = 'dark', animated = true }: ThresholdProps) {
  const reduce = useReducedMotion()
  const isStatic = !animated || !!reduce
  const isLight = tone === 'light'
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={cn(isLight ? 'text-primary' : 'text-secondary', className)}
      style={isLight ? undefined : { filter: GLOW }}
      role="img"
      aria-label="Mindscape"
      variants={container}
      initial={isStatic ? 'show' : 'hidden'}
      animate="show"
    >
      <motion.path variants={draw} d="M40 64 L100 24 L160 64" {...stroke} />
      <motion.line variants={draw} x1="46" y1="64" x2="154" y2="64" {...stroke} />
      <motion.line variants={draw} x1="64" y1="64" x2="64" y2="166" {...stroke} />
      <motion.line variants={draw} x1="136" y1="64" x2="136" y2="166" {...stroke} />
      <motion.path variants={draw} d="M86 166 L86 126 A14 14 0 0 1 114 126 L114 166" {...stroke} />
      <motion.line variants={draw} x1="40" y1="166" x2="160" y2="166" {...stroke} />
      <motion.line variants={draw} x1="28" y1="178" x2="172" y2="178" {...stroke} />
      <motion.circle
        variants={spark}
        cx="100"
        cy="138"
        r="7"
        fill={isLight ? 'currentColor' : 'white'}
      />
    </motion.svg>
  )
}
