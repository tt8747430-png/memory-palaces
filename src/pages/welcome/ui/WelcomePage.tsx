import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useSessionStore } from '@/entities/session'
import { Button, WordReveal } from '@/shared/ui'
import { PalaceThreshold } from '@/widgets/palace-threshold'

export interface WelcomePageProps {
  onContinue: () => void
}

const AURA_BG = 'radial-gradient(circle at center, oklch(var(--p-tint-sky) / 0.45), transparent 60%)'

/** Post-signup arrival. The threshold settles "open" over a navy ground lit by one
 * soft aura, the new member is greeted by name a word at a time, then the CTA
 * choreographs in beneath. Reduced motion drops the delays to a plain crossfade. */
export function WelcomePage({ onContinue }: WelcomePageProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const name = useSessionStore((state) => state.session?.displayName.trim() ?? '')

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-gradient-to-b from-primary via-accent to-secondary px-6 pt-safe pb-safe text-center">
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

      <PalaceThreshold className="relative z-10 size-48" />

      <div className="relative z-10 flex flex-col gap-2">
        <WordReveal
          as="h1"
          text={t('auth.welcome.greeting', { name })}
          delay={reduce ? 0 : 0.6}
          className="text-balance text-[length:var(--p-text-headline)] font-semibold text-white"
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
        <Button variant="secondary" size="lg" className="w-full" onClick={onContinue}>
          {t('auth.welcome.cta')}
        </Button>
      </motion.div>
    </main>
  )
}
