import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { PalaceThreshold } from '@/widgets/palace-threshold'

export interface SplashOverlayProps {
  onDone: () => void
}

const FULL_MS = 2000
const REDUCED_MS = 500

/** First-paint brand moment: the palace threshold forms over a deep-navy ground,
 * then hands off to the app. Self-dismisses (shorter under reduced motion) and is
 * skippable. Masks the brief session restore behind one intentional beat. */
export function SplashOverlay({ onDone }: SplashOverlayProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()

  useEffect(() => {
    const id = setTimeout(onDone, reduce ? REDUCED_MS : FULL_MS)
    return () => clearTimeout(id)
  }, [onDone, reduce])

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-primary via-accent to-secondary px-6 text-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
    >
      <button
        type="button"
        onClick={onDone}
        className="absolute right-5 top-[calc(env(safe-area-inset-top)+1rem)] text-[length:var(--p-text-label)] font-medium text-white/75"
      >
        {t('auth.splash.skip')}
      </button>

      <PalaceThreshold className="size-44" />

      <motion.div
        className="flex flex-col items-center gap-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 1.1, duration: 0.5 }}
      >
        <span className="text-[length:var(--p-text-headline)] font-semibold tracking-tight text-white">
          {t('common.appName')}
        </span>
        <span className="text-[length:var(--p-text-sub)] text-white/80">
          {t('auth.splash.tagline')}
        </span>
      </motion.div>
    </motion.div>
  )
}
