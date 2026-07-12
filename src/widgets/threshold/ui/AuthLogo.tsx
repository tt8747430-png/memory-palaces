import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/shared/lib'
import { Threshold } from './Threshold'

const GLOW = 'radial-gradient(circle, oklch(var(--p-tint-sky) / 0.6), transparent 70%)'

export function AuthLogo({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <span className={cn('relative grid place-items-center', className)}>
      {reduce ? (
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 size-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
          style={{ background: GLOW }}
        />
      ) : (
        <motion.span
          aria-hidden
          className="absolute left-1/2 top-1/2 size-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
          style={{ background: GLOW }}
          initial={{ opacity: 0.45, scale: 0.9 }}
          animate={{ opacity: [0.45, 0.75, 0.45], scale: [0.9, 1.06, 0.9] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <Threshold tone="light" animated={false} className="relative size-full" />
    </span>
  )
}
