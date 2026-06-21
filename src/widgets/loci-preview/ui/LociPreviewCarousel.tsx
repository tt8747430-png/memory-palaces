import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  animate,
  AnimatePresence,
  type HTMLMotionProps,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { useDrag } from '@use-gesture/react'
import { ChevronLeft, ChevronRight, Layers, Play, Volume2 } from 'lucide-react'
import type { Locus } from '@/entities/locus'
import type { StudyDirection } from '@/entities/palace'
import { speak, speechAvailable, tick } from '@/shared/lib'
import { Button, EmptyState } from '@/shared/ui'

export interface LociPreviewCarouselProps {
  loci: Locus[]
  /** Which face leads: `front` shows the term, `back` shows the definition. */
  direction?: StudyDirection
  /** Launch the full flashcard session for this deck. Renders the primary CTA. */
  onOpen?: () => void
  /** Label for the open CTA; defaults to "Study flashcards". */
  openLabel?: string
  /** Offer read-aloud when true and the browser supports speech. */
  speakable?: boolean
  /** Empty-state action — e.g. jump to the Manage view to add the first card. */
  onAddFirst?: () => void
}

const SPRING = { type: 'spring', stiffness: 500, damping: 36 } as const
const CARD_EASE = [0.16, 1, 0.3, 1] as const

/**
 * A peekable flashcard deck: one card at a time, swipe or tap the arrows to move, tap
 * the card to flip term/definition, with a faint card peeking behind to read as a
 * stack. The centrepiece of the room hub's Study view; the full session lives in the
 * room-train page.
 */
export function LociPreviewCarousel({
  loci,
  direction = 'front',
  onOpen,
  openLabel,
  speakable = false,
  onAddFirst,
}: LociPreviewCarouselProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 0, 220], [-7, 0, 7])
  const leftHint = useTransform(x, [-120, -30], [1, 0])
  const rightHint = useTransform(x, [30, 120], [0, 1])

  const count = loci.length

  // Keep the pointer in range if the deck shrinks (e.g. a card was deleted while open).
  useEffect(() => {
    if (index > count - 1) setIndex(Math.max(0, count - 1))
  }, [count, index])

  const go = (delta: number) => {
    const next = index + delta
    if (next < 0 || next > count - 1) {
      animate(x, 0, SPRING)
      return
    }
    setFlipped(false)
    setIndex(next)
    tick()
    x.set(0)
  }

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx], tap }) => {
      if (tap) {
        setFlipped((value) => !value)
        return
      }
      if (down) {
        x.set(mx)
        return
      }
      const fling = vx > 0.45
      if ((mx < -70 || (fling && dx < 0)) && index < count - 1) {
        go(1)
      } else if ((mx > 70 || (fling && dx > 0)) && index > 0) {
        go(-1)
      } else {
        animate(x, 0, SPRING)
      }
    },
    { axis: 'x', filterTaps: true, pointer: { touch: true } },
  )

  if (count === 0) {
    return (
      <EmptyState
        icon={<Layers className="size-7" aria-hidden />}
        title={t('loci.preview.emptyTitle')}
        description={t('loci.preview.emptyBody')}
        action={
          onAddFirst ? (
            <Button onClick={onAddFirst} size="md">
              {t('loci.preview.addFirst')}
            </Button>
          ) : undefined
        }
      />
    )
  }

  const current = loci[Math.min(index, count - 1)]!
  const term = direction === 'front' ? current.front : current.back
  const def = direction === 'front' ? current.back : current.front
  const showSpeak = speakable && speechAvailable()

  return (
    <div>
      <div className="relative [perspective:1400px]">
        {/* Stacked peek card behind, for depth */}
        {count > 1 ? (
          <div
            aria-hidden
            className="absolute inset-x-3 top-2 bottom-0 -z-0 rounded-card-featured border border-border bg-card/55 shadow-rest"
            style={{ transform: 'translateY(10px) scale(0.96)' }}
          />
        ) : null}

        <motion.div
          {...(bind() as unknown as HTMLMotionProps<'div'>)}
          style={{ x, rotate }}
          className="relative z-10 touch-pan-y"
        >
          {/* Directional move hints */}
          <motion.div
            style={{ opacity: leftHint }}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-primary p-2 text-primary-foreground shadow-interactive"
          >
            <ChevronLeft className="size-[18px]" />
          </motion.div>
          <motion.div
            style={{ opacity: rightHint }}
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-primary p-2 text-primary-foreground shadow-interactive"
          >
            <ChevronRight className="size-[18px]" />
          </motion.div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease: CARD_EASE }}
              className="h-[clamp(190px,32vh,244px)]"
            >
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.45, ease: CARD_EASE }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative size-full cursor-pointer select-none"
              >
                {/* Term face */}
                <div
                  style={{ backfaceVisibility: 'hidden' }}
                  className="absolute inset-0 flex flex-col rounded-card-featured border border-border bg-card p-5 shadow-elevated"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-control bg-info-surface px-2.5 py-1 text-[length:var(--p-text-tiny)] font-semibold text-info-foreground">
                      {direction === 'front'
                        ? t('loci.preview.term')
                        : t('loci.preview.definition')}
                    </span>
                    {showSpeak ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          speak(term)
                        }}
                        aria-label={t('loci.preview.readAloud')}
                        className="grid size-9 place-items-center rounded-full bg-info-surface text-heading transition-transform duration-150 ease-out active:scale-90"
                      >
                        <Volume2 className="size-4" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                  <div className="flex flex-1 items-center justify-center px-2 text-center">
                    <p className="text-balance break-words text-[clamp(22px,6vw,30px)] font-bold leading-tight text-heading">
                      {term}
                    </p>
                  </div>
                  <p className="text-center text-[length:var(--p-text-label)] font-medium text-muted-foreground">
                    {t('loci.preview.flip')}
                  </p>
                </div>
                {/* Definition face */}
                <div
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-card-featured border border-border bg-card p-5 text-center shadow-elevated"
                >
                  <p className="text-balance break-words text-[clamp(17px,4.5vw,20px)] font-semibold leading-snug text-heading">
                    {def}
                  </p>
                  {current.hint ? (
                    <p className="mt-3 max-w-[34ch] text-[length:var(--p-text-label)] italic leading-relaxed text-accent">
                      {current.hint}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label={t('loci.preview.prev')}
          className="grid size-11 place-items-center rounded-full border border-border bg-card text-heading shadow-rest transition-transform duration-150 ease-out active:scale-90 disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[length:var(--p-text-label)] font-semibold text-heading">
            {t('loci.preview.position', { current: index + 1, total: count })}
          </span>
          <div className="flex items-center gap-1.5" aria-hidden>
            {loci.slice(0, 8).map((locus, dotIndex) => (
              <span
                key={locus.id}
                className={
                  dotIndex === Math.min(index, 7)
                    ? 'h-1.5 w-4 rounded-full bg-primary transition-all'
                    : 'h-1.5 w-1.5 rounded-full bg-primary/25 transition-all'
                }
              />
            ))}
            {count > 8 ? (
              <span className="text-[length:var(--p-text-tiny)] font-medium text-primary/45">
                +{count - 8}
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          disabled={index >= count - 1}
          aria-label={t('loci.preview.next')}
          className="grid size-11 place-items-center rounded-full border border-border bg-card text-heading shadow-rest transition-transform duration-150 ease-out active:scale-90 disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      {onOpen ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onOpen}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-card bg-gradient-to-r from-primary to-accent text-[length:var(--p-text-sub)] font-semibold text-primary-foreground shadow-interactive"
        >
          <Play className="size-[18px]" aria-hidden />
          {openLabel ?? t('loci.preview.openLabel')}
        </motion.button>
      ) : null}
    </div>
  )
}
