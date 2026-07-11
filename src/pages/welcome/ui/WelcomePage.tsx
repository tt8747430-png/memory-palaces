import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useSessionStore } from '@/entities/session'
import { Button, WordReveal } from '@/shared/ui'
import { Threshold } from '@/widgets/threshold'

export interface WelcomePageProps {
  onContinue: () => void
}

const AURA_BG =
  'radial-gradient(circle at center, oklch(var(--p-tint-sky) / 0.45), transparent 60%)'

/** Slow embers drifting up past the threshold — the spark igniting, carried into the
 * room. Fixed positions so they don't re-randomize per render; dropped under reduced motion. */
const EMBERS = [
  { left: '32%', top: '62%', dx: 10, dy: -44, delay: 0.4, duration: 7 },
  { left: '66%', top: '56%', dx: -14, dy: -56, delay: 1.6, duration: 8 },
  { left: '50%', top: '70%', dx: 4, dy: -38, delay: 2.8, duration: 6.5 },
] as const

/** Post-signup arrival. The threshold settles "open" over a navy ground lit by one
 * soft aura, the new member is greeted by name a word at a time, then the CTA
 * choreographs in beneath. Reduced motion drops the delays to a plain crossfade. */
export function WelcomePage({ onContinue }: WelcomePageProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const name = useSessionStore((state) => state.session?.displayName.trim() ?? '')

  return (
    <main className="relative flex h-full flex-col items-center justify-center gap-8 overflow-hidden bg-gradient-to-b from-primary via-accent to-secondary px-6 pt-safe pb-safe text-center">
      {reduce ? (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: AURA_BG }}
        />
      ) : (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: AURA_BG }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      {reduce
        ? null
        : EMBERS.map((ember, index) => (
            <motion.span
              key={index}
              aria-hidden
              className="pointer-events-none absolute z-0 size-2 rounded-full bg-white/80 blur-[1px]"
              style={{ left: ember.left, top: ember.top }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0], x: [0, ember.dx, 0], y: [0, ember.dy, 0] }}
              transition={{
                duration: ember.duration,
                delay: ember.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}

      <Threshold className="relative z-10 size-48" />

      <div className="relative z-10 flex flex-col gap-2">
        <WordReveal
          as="h1"
          text={t('auth.welcome.greeting', { name })}
          delay={reduce ? 0 : 0.6}
          className="text-balance text-[length:var(--p-text-headline)] font-bold tracking-tight text-white"
        />
        <motion.p
          className="text-balance text-[length:var(--p-text-sub)] text-white/85"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 1.0, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {t('auth.welcome.body')}
        </motion.p>
      </div>

      <motion.div
        className="relative z-10 w-full max-w-[360px]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 1.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Button
          variant="ghost"
          size="lg"
          className="w-full border-transparent shadow-elevated"
          onClick={onContinue}
        >
          {t('auth.welcome.cta')}
        </Button>
      </motion.div>
    </main>
  )
}
