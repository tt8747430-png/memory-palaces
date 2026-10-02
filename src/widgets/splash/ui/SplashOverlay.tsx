import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { MARK_BOX, MARK_LIGHT_CENTER, SPLASH_MARK_PX } from '@/shared/config/brand-mark'
import { EASE_EXPO } from '@/shared/lib'
import { WordReveal } from '@/shared/ui'
import { Threshold } from '@/widgets/threshold'

export interface SplashOverlayProps {
  /** A first Sync is still bringing the decks in, and the intro has played. */
  waiting: boolean
  onIntroDone: () => void
  /** Lets the learner in now — past the intro, or past a first Sync still running. */
  onSkip: () => void
}

const FULL_MS = 1800
const REDUCED_MS = 500

/** The way in: the mark grows about its lit doorway until the doorway is the screen. */
const DOORWAY_ORIGIN = `${(MARK_LIGHT_CENTER.x / MARK_BOX) * 100}% ${(MARK_LIGHT_CENTER.y / MARK_BOX) * 100}%`
const ENTER = { duration: 0.7, ease: [0.55, 0, 0.85, 0.3] } as const

/** Light around the palace, fading out above the name so the name keeps its contrast. */
const BLOOM =
  'radial-gradient(circle closest-side, oklch(var(--p-tint-sky) / 0.32), transparent 70%)'

/**
 * The first frame is the launch screen iOS showed and the page the browser painted before the app
 * loaded: the mark, its box `SPLASH_MARK_PX` square at the centre, on the chrome colour. From there
 * the light blooms, the name arrives, and leaving walks through the door.
 */
export function SplashOverlay({ waiting, onIntroDone, onSkip }: SplashOverlayProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()

  useEffect(() => {
    const id = setTimeout(onIntroDone, reduce ? REDUCED_MS : FULL_MS)
    return () => clearTimeout(id)
  }, [onIntroDone, reduce])

  return (
    <motion.div
      className="fixed inset-0 z-(--z-splash) overflow-hidden bg-(--status-bar) text-white"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: reduce
          ? { duration: 0.25, ease: 'easeOut' }
          : { duration: 0.4, delay: 0.3, ease: 'easeOut' },
      }}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-104 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: BLOOM }}
        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.1, ease: EASE_EXPO }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: SPLASH_MARK_PX, height: SPLASH_MARK_PX, transformOrigin: DOORWAY_ORIGIN }}
        exit={reduce ? undefined : { scale: 16, transition: ENTER }}
      >
        <Threshold entrance="none" className="size-full" />
      </motion.div>

      <motion.div
        className="absolute inset-x-0 top-[calc(50%+5.5rem)] flex flex-col items-center gap-1 px-6 text-center"
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
      >
        <WordReveal
          text={t('common.appName')}
          delay={reduce ? 0 : 0.35}
          className="text-headline font-semibold tracking-tight"
        />
        <WordReveal
          text={t('auth.splash.tagline')}
          delay={reduce ? 0 : 0.6}
          stagger={0.06}
          className="text-body text-white/85"
        />
        {/* Always mounted, so a screen reader hears the line when it arrives. */}
        <p role="status" className="mt-5 min-h-5 text-label text-white/80">
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

      <motion.button
        type="button"
        onClick={onSkip}
        className="absolute right-2 top-[calc(var(--safe-top)+0.5rem)] min-h-11 rounded-control px-3 text-label font-medium text-white/80 transition-colors active:bg-white/10"
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
      >
        {t(waiting ? 'auth.splash.openNow' : 'auth.splash.skip')}
      </motion.button>
    </motion.div>
  )
}
