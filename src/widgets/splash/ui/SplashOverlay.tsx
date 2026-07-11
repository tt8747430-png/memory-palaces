import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { WordReveal } from '@/shared/ui'
import { Threshold } from '@/widgets/threshold'

export interface SplashOverlayProps {
  onDone: () => void
}

const FULL_MS = 2400
const REDUCED_MS = 500

/** Soft light bloom behind the mark — a single navy-ground aura, not a loop. */
const AURA_BG =
  'radial-gradient(circle at center, oklch(var(--p-tint-sky) / 0.45), transparent 60%)'

/** First-paint brand moment: a light aura blooms, the threshold draws itself
 * over a deep-navy ground, then the wordmark reveals a word at a time before handing
 * off to the app. Self-dismisses (shorter under reduced motion) and is skippable. */
export function SplashOverlay({ onDone }: SplashOverlayProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()

  useEffect(() => {
    const id = setTimeout(onDone, reduce ? REDUCED_MS : FULL_MS)
    return () => clearTimeout(id)
  }, [onDone, reduce])

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 overflow-hidden bg-gradient-to-b from-primary via-accent to-secondary px-6 text-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
    >
      <button
        type="button"
        onClick={onDone}
        className="absolute right-5 top-[calc(env(safe-area-inset-top)+1rem)] z-10 text-[length:var(--p-text-label)] font-medium text-white/75"
      >
        {t('auth.splash.skip')}
      </button>

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

      {reduce ? null : (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"
          initial={{ opacity: 0.5, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.9 }}
          transition={{ duration: 1.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      <Threshold className="relative z-10 size-44" />

      <div className="relative z-10 flex flex-col items-center gap-1">
        <WordReveal
          text={t('common.appName')}
          delay={reduce ? 0 : 0.85}
          className="text-[length:var(--p-text-headline)] font-semibold tracking-tight text-white"
        />
        <WordReveal
          text={t('auth.splash.tagline')}
          delay={reduce ? 0 : 1.15}
          stagger={0.06}
          className="text-[length:var(--p-text-sub)] text-white/80"
        />
      </div>
    </motion.div>
  )
}
