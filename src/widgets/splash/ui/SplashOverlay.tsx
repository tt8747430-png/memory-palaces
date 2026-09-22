import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Aura, WordReveal } from '@/shared/ui'
import { Threshold } from '@/widgets/threshold'
import { EASE_EXPO } from '@/shared/lib'

export interface SplashOverlayProps {
  /** A first Sync is still bringing the decks in, and the intro has played. */
  waiting: boolean
  onIntroDone: () => void
  /** Lets the learner in now — past the intro, or past a first Sync still running. */
  onSkip: () => void
}

const FULL_MS = 2400
const REDUCED_MS = 500

export function SplashOverlay({ waiting, onIntroDone, onSkip }: SplashOverlayProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()

  useEffect(() => {
    const id = setTimeout(onIntroDone, reduce ? REDUCED_MS : FULL_MS)
    return () => clearTimeout(id)
  }, [onIntroDone, reduce])

  return (
    <motion.div
      className="fixed inset-0 z-(--z-splash) flex flex-col items-center justify-center gap-6 overflow-hidden bg-threshold px-6 text-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
    >
      <button
        type="button"
        onClick={onSkip}
        className="absolute right-5 top-[calc(var(--safe-top)+1rem)] z-10 text-label font-medium text-white/75"
      >
        {t(waiting ? 'auth.splash.openNow' : 'auth.splash.skip')}
      </button>

      <Aura />

      {reduce ? null : (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"
          initial={{ opacity: 0.5, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.9 }}
          transition={{ duration: 1.7, delay: 0.35, ease: EASE_EXPO }}
        />
      )}

      <Threshold className="relative z-10 size-44" />

      <div className="relative z-10 flex flex-col items-center gap-1">
        <WordReveal
          text={t('common.appName')}
          delay={reduce ? 0 : 0.85}
          className="text-headline font-semibold tracking-tight text-white"
        />
        <WordReveal
          text={t('auth.splash.tagline')}
          delay={reduce ? 0 : 1.15}
          stagger={0.06}
          className="text-body text-white/80"
        />
      </div>

      {/* Always mounted, so a screen reader hears the line when it arrives. */}
      <p role="status" className="relative z-10 min-h-5 text-label text-white/75">
        {waiting ? (
          <motion.span
            className="block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {t('auth.splash.syncing')}
          </motion.span>
        ) : null}
      </p>
    </motion.div>
  )
}
