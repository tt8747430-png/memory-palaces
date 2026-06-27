import { useEffect, useRef, useState } from 'react'
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
import { Flag, Lightbulb, MapPin, Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn, impact, tick } from '@/shared/lib'
import { Chip, SrsStatusChip } from '@/shared/ui'
import type { StudyCard, StudyDirection } from '../model/types'

export type SwipeAction = 'right' | 'left' | 'up' | 'down'

export interface StudyCardDeckProps {
  card: StudyCard
  nextCard?: StudyCard
  direction: StudyDirection
  flipped: boolean
  mode: 'review' | 'browse'
  swipeEnabled: boolean
  canSpeak: boolean
  onFlip: () => void
  /** A committed swipe in one of four directions. */
  onCommit: (action: SwipeAction) => void
  onSpeak: (text: string) => void
  /** Press-and-hold opened (quick actions). */
  onLongPress?: () => void
}

const CARD_HEIGHT = 'h-[clamp(300px,52vh,440px)]'

/** The flip-card deck: tap to flip, swipe to sort (right/left), nudge up to flag,
 * down to skip — the gesture surface over the session's dispatch actions. Owns its
 * own motion values; the parent maps `onCommit` to the State machine + grade command. */
export function StudyCardDeck({
  card,
  nextCard,
  direction,
  flipped,
  mode,
  swipeEnabled,
  canSpeak,
  onFlip,
  onCommit,
  onSpeak,
  onLongPress,
}: StudyCardDeckProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const [peek, setPeek] = useState(false)
  const [locked, setLocked] = useState(false)
  const holdTimer = useRef<number | undefined>(undefined)
  const heldRef = useRef(false)

  const locus = card.locus
  const prompt = direction === 'front' ? locus.front : locus.back
  const answer = direction === 'front' ? locus.back : locus.front

  // Reset the peek hint whenever the card changes.
  useEffect(() => setPeek(false), [locus.id])

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const rotate = useTransform(x, [-260, 0, 260], [-10, 0, 10])
  const gotItOpacity = useTransform(x, [36, 130], [0, 1])
  const learningOpacity = useTransform(x, [-130, -36], [1, 0])
  const flagOpacity = useTransform(y, [-130, -40], [1, 0])
  const skipOpacity = useTransform(y, [40, 130], [0, 1])

  const clearHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = undefined
    }
  }
  useEffect(() => () => clearHold(), [])

  const snapBack = () => {
    animate(x, 0, { type: 'spring', stiffness: 520, damping: 34 })
    animate(y, 0, { type: 'spring', stiffness: 520, damping: 34 })
  }

  const commit = async (action: SwipeAction) => {
    if (locked) return
    if (action === 'up') {
      onCommit('up')
      tick()
      snapBack()
      return
    }
    setLocked(true)
    impact()
    const off = 620
    const tx = action === 'right' ? off : action === 'left' ? -off : 0
    const ty = action === 'down' ? off : 0
    const dur = reduce ? 0 : 0.24
    await Promise.all([
      animate(x, tx, { duration: dur, ease: [0.4, 0, 1, 1] }).finished,
      ty ? animate(y, ty, { duration: dur, ease: [0.4, 0, 1, 1] }).finished : Promise.resolve(),
    ])
    onCommit(action)
    x.jump(0)
    y.jump(0)
    if (!reduce) {
      scale.jump(0.96)
      animate(scale, 1, { type: 'spring', stiffness: 540, damping: 32 })
    }
    setLocked(false)
  }

  const bind = useDrag(
    ({ first, down, movement: [mx, my], velocity: [vx, vy], tap }) => {
      if (locked) return
      if (first) {
        heldRef.current = false
        clearHold()
        holdTimer.current = window.setTimeout(() => {
          heldRef.current = true
          impact()
          onLongPress?.()
        }, 480)
      }
      if (tap) {
        clearHold()
        if (heldRef.current) {
          heldRef.current = false
          return
        }
        onFlip()
        return
      }
      if (Math.abs(mx) > 6 || Math.abs(my) > 6) clearHold()
      if (down) {
        x.set(mx)
        y.set(my)
        return
      }
      clearHold()
      if (heldRef.current) {
        heldRef.current = false
        snapBack()
        return
      }
      const ax = Math.abs(mx)
      const ay = Math.abs(my)
      const fling = Math.max(vx, vy) > 0.5
      if (ax < 80 && ay < 80 && !fling) {
        snapBack()
        return
      }
      if (ax >= ay) commit(mx > 0 ? 'right' : 'left')
      else if (my < 0) commit('up')
      else commit('down')
    },
    { filterTaps: true, pointer: { touch: true }, enabled: swipeEnabled },
  )

  const faceClass =
    'absolute inset-0 flex flex-col rounded-card-featured bg-card-glass p-7 shadow-elevated [backface-visibility:hidden]'

  return (
    <div className="relative w-full max-w-md [perspective:1200px]">
      {nextCard ? (
        <div
          aria-hidden
          className={`absolute inset-x-2 top-3 -z-0 rounded-card-featured bg-card-glass shadow-rest ${CARD_HEIGHT}`}
          style={{ transform: 'translateY(14px) scale(0.95)' }}
        />
      ) : null}

      {swipeEnabled ? (
        <>
          <SwipeBadge style={{ opacity: gotItOpacity }} className="left-5 top-5 -rotate-12 text-[var(--success-on-surface)]">
            {mode === 'review' ? t('study.swipeGotIt') : t('study.prev')}
          </SwipeBadge>
          <SwipeBadge style={{ opacity: learningOpacity }} className="right-5 top-5 rotate-12 text-[var(--warning-foreground)]">
            {mode === 'review' ? t('study.swipeLearning') : t('study.next')}
          </SwipeBadge>
          <SwipeBadge
            style={{ opacity: flagOpacity }}
            className="left-1/2 top-4 -translate-x-1/2 text-[var(--rating-edge)]"
          >
            {t('study.flag')}
          </SwipeBadge>
          <SwipeBadge
            style={{ opacity: skipOpacity }}
            className="bottom-4 left-1/2 -translate-x-1/2 text-muted-foreground"
          >
            {t('study.skip')}
          </SwipeBadge>
        </>
      ) : null}

      <motion.div
        {...(bind() as unknown as HTMLMotionProps<'div'>)}
        style={{ x, y, rotate, scale }}
        className="relative z-10 touch-none"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={locus.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={CARD_HEIGHT}
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative h-full w-full cursor-pointer select-none"
            >
              {/* Front */}
              <div className={faceClass}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Chip icon={<MapPin className="size-3" aria-hidden />}>
                      {direction === 'front' ? t('study.recall') : t('study.term')}
                    </Chip>
                    {mode === 'review' ? <SrsStatusChip srs={locus.srs} /> : null}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {canSpeak ? (
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation()
                          onSpeak(prompt)
                        }}
                        aria-label={t('study.readAloud')}
                        className="grid size-7 place-items-center rounded-control bg-info-surface text-heading active:scale-90"
                      >
                        <Volume2 className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                    {locus.flagged ? (
                      <Flag className="size-4 fill-[var(--rating)] text-[var(--rating-edge)]" aria-hidden />
                    ) : null}
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 scrollbar-hide flex-col items-center justify-center overflow-y-auto py-2 text-center">
                  <h2 className="mb-3 text-balance break-words text-[clamp(22px,6vw,30px)] font-bold text-heading">
                    {prompt}
                  </h2>
                  {locus.tip ? (
                    <div className="mt-1 flex min-h-[44px] items-center justify-center">
                      {peek ? (
                        <motion.p
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="max-w-[36ch] text-[length:var(--p-text-label)] italic text-muted-foreground"
                        >
                          {locus.tip}
                        </motion.p>
                      ) : (
                        <button
                          type="button"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation()
                            setPeek(true)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning-surface)] px-3 py-1.5 text-[length:var(--p-text-label)] font-semibold text-[var(--warning-foreground)]"
                        >
                          <Lightbulb className="size-3.5" aria-hidden />
                          {t('study.peekHint')}
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>

                <p className="text-center text-[length:var(--p-text-label)] text-muted-foreground">
                  {t('study.tapToFlip')}
                </p>
              </div>

              {/* Back */}
              <div className={`${faceClass} [transform:rotateY(180deg)]`}>
                <div className="flex min-h-0 flex-1 scrollbar-hide flex-col items-center justify-center overflow-y-auto text-center">
                  <p className="text-balance break-words text-[clamp(17px,4.5vw,20px)] font-semibold leading-snug text-heading">
                    {answer}
                  </p>
                  {locus.hint ? (
                    <div className="mt-5 w-full rounded-card border border-secondary/30 bg-secondary/20 p-4 text-left">
                      <div className="mb-1.5 flex items-center gap-2">
                        <MapPin className="size-4 shrink-0 text-heading" aria-hidden />
                        <p className="text-[length:var(--p-text-label)] font-semibold text-heading">
                          {t('study.whereToPicture')}
                        </p>
                      </div>
                      <p className="text-[length:var(--p-text-label)] italic leading-relaxed text-muted-foreground">
                        {locus.hint}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function SwipeBadge({
  children,
  style,
  className,
}: {
  children: React.ReactNode
  style: HTMLMotionProps<'div'>['style']
  className: string
}) {
  return (
    <motion.div
      style={style}
      className={cn(
        'pointer-events-none absolute z-30 rounded-card border-2 border-current bg-card px-3 py-1.5 text-[length:var(--p-text-sub)] font-extrabold uppercase tracking-wide',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
