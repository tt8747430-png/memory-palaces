import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/shared/lib'

/** One large, softly breathing sky wash that deepens the daylight ground. */
const AURA_BG = 'radial-gradient(circle at center, oklch(var(--p-tint-sky) / 0.22), transparent 60%)'

/** Deterministic ambient accents (fixed so they don't re-randomize each render). */
const ACCENTS = [
  { left: '14%', top: '20%', dx: 50, dy: 38, delay: 0 },
  { left: '80%', top: '16%', dx: -44, dy: 52, delay: 1.4 },
  { left: '68%', top: '74%', dx: -38, dy: -46, delay: 2.8 },
] as const

function AuthAtmosphere() {
  const reduce = useReducedMotion()
  return (
    <div
      data-testid="auth-atmosphere"
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Slow gradient aura — opacity-breathe + drift only (no scale on the heavy
          blur, so it composites cheaply at 60fps on a phone). */}
      {reduce ? (
        <span
          className="absolute left-1/2 top-1/3 size-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: AURA_BG }}
        />
      ) : (
        <motion.span
          className="absolute left-1/2 top-1/3 size-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: AURA_BG }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.4, 0.62, 0.4], x: [-24, 24, -24], y: [-14, 16, -14] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* 2–3 drifting accents that catch the light over the aura. */}
      {ACCENTS.map((accent, i) =>
        reduce ? (
          <span
            key={i}
            className="absolute size-28 rounded-full bg-gradient-to-br from-secondary to-primary opacity-[0.1] blur-2xl"
            style={{ left: accent.left, top: accent.top }}
          />
        ) : (
          <motion.span
            key={i}
            className="absolute size-28 rounded-full bg-gradient-to-br from-secondary to-primary blur-2xl"
            style={{ left: accent.left, top: accent.top }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 0.16, 0], scale: [0.7, 1, 0.7], x: [0, accent.dx, 0], y: [0, accent.dy, 0] }}
            transition={{ duration: 12, delay: accent.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ),
      )}
    </div>
  )
}

/**
 * Full-height auth shell — the "Lucid Atrium" atmosphere (daylight ground, one slow
 * gradient aura, a few drifting accents) behind a centered phone column. Shared by
 * login, signup and forgot so the entry flow reads as one lit room.
 */
export function AuthScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className="relative h-full overflow-hidden bg-daylight">
      <AuthAtmosphere />
      {/* Scroll layer over the fixed atmosphere; the column grows past the viewport
          (min-h-full) so tall forms scroll instead of clipping. */}
      <div className="relative h-full overflow-y-auto overscroll-none scrollbar-hide">
        <div
          className={cn(
            'mx-auto flex min-h-full w-full max-w-[430px] flex-col px-6 pt-safe pb-safe',
            className,
          )}
        >
          {children}
        </div>
      </div>
    </main>
  )
}
