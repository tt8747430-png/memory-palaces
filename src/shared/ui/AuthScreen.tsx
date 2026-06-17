import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/shared/lib'

/** Deterministic ambient orbs (fixed so they don't re-randomize each render). */
const ORBS = [
  { left: '12%', top: '18%', dx: 60, dy: 40, delay: 0 },
  { left: '78%', top: '12%', dx: -50, dy: 60, delay: 0.6 },
  { left: '24%', top: '72%', dx: 40, dy: -50, delay: 1.2 },
  { left: '82%', top: '66%', dx: -60, dy: -30, delay: 1.8 },
  { left: '50%', top: '40%', dx: 30, dy: 50, delay: 2.4 },
] as const

function AuthAtmosphere() {
  const reduce = useReducedMotion()
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {ORBS.map((orb, i) =>
        reduce ? (
          <span
            key={i}
            className="absolute size-24 rounded-full bg-gradient-to-br from-secondary to-primary opacity-[0.12] blur-2xl"
            style={{ left: orb.left, top: orb.top }}
          />
        ) : (
          <motion.span
            key={i}
            className="absolute size-24 rounded-full bg-gradient-to-br from-secondary to-primary blur-2xl"
            style={{ left: orb.left, top: orb.top }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.18, 0], scale: [0.6, 1, 0.6], x: [0, orb.dx, 0], y: [0, orb.dy, 0] }}
            transition={{ duration: 9, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ),
      )}
    </div>
  )
}

/**
 * Full-height auth shell — the "Lucid Atrium" atmosphere (daylight ground + slow
 * ambient orbs) behind a centered phone column. Used by login, signup, forgot and
 * the welcome moment so the entry flow reads as one lit room.
 */
export function AuthScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-daylight">
      <AuthAtmosphere />
      <div
        className={cn(
          'relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pt-safe pb-safe',
          className,
        )}
      >
        {children}
      </div>
    </main>
  )
}
