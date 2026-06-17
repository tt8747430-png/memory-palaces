import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useSessionStore } from '@/entities/session'
import { Button } from '@/shared/ui'
import { PalaceThreshold } from '@/widgets/palace-threshold'

export interface WelcomePageProps {
  onContinue: () => void
}

/** Post-signup arrival. The threshold settles "open" over the navy ground and the
 * new member is greeted by name before stepping into the app. */
export function WelcomePage({ onContinue }: WelcomePageProps) {
  const { t } = useTranslation()
  const name = useSessionStore((state) => state.session?.displayName.trim() ?? '')

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-gradient-to-b from-primary via-accent to-secondary px-6 pt-safe pb-safe text-center">
      <PalaceThreshold className="size-48" />

      <motion.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-balance text-[length:var(--p-text-headline)] font-semibold text-white">
          {t('auth.welcome.greeting', { name })}
        </h1>
        <p className="text-balance text-[length:var(--p-text-sub)] text-white/85">
          {t('auth.welcome.body')}
        </p>
      </motion.div>

      <motion.div
        className="w-full max-w-[360px]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <Button variant="secondary" size="lg" className="w-full" onClick={onContinue}>
          {t('auth.welcome.cta')}
        </Button>
      </motion.div>
    </main>
  )
}
