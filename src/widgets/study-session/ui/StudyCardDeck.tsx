import { useEffect, useRef, useState } from 'react'
import {
  animate,
  AnimatePresence,
  type HTMLMotionProps,
  motion,
  type MotionValue,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { useDrag } from '@use-gesture/react'
import { Flag, Lightbulb, MapPin, Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn, impact, recallAnswer, tick } from '@/shared/lib'
import {
  type FlashcardSwipeAction,
  FLASHCARD_SWIPE_ACTION_META,
  type FlashcardSwipeConfig,
  isGradeAction,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import type { StudyCard, StudyDirection } from '../model/types'

export type { SwipeDirection }

export interface StudyCardDeckProps {
  card: StudyCard
  nextCard?: StudyCard
  direction: StudyDirection
  flipped: boolean
  /** The active four-direction gesture map. */
  swipeConfig: FlashcardSwipeConfig
  canSpeak: boolean
  onFlip: () => void
  /** A committed swipe in a direction whose action is not `none`. */
  onCommit: (direction: SwipeDirection) => void
  onSpeak: (text: string) => void
  /** Press-and-hold opened (quick actions). */
  onLongPress?: () => void
}

const CARD_HEIGHT = 'h-[clamp(300px,52vh,440px)]'

/** Text tint per swipe action, so a badge reads in the same colour language as the grade
 * buttons. `none` never renders a badge. */
const ACTION_TINT: Record<Exclude<FlashcardSwipeAction, 'none'>, string> = {
  again: 'text-[var(--danger-on-surface)]',
  hard: 'text-[var(--warning-foreground)]',
  good: 'text-[var(--success-on-surface)]',
  easy: 'text-[var(--accent)]',
  flag: 'text-[var(--rating-edge)]',
  skip: 'text-muted-foreground',
}

/** Actions that leave the current card (grades + skip). `flag` and `none` keep it in place,
 * so a fling in their direction springs back instead of flying off. */
function actionAdvances(action: FlashcardSwipeAction): boolean {
  return isGradeAction(action) || action === 'skip'
}

/** The flip-card deck: tap to flip, fling in any of four directions to run that direction's
 * configured action. Owns its own motion values; the parent maps `onCommit(direction)` to the
 * state machine + grade command via the same swipe config passed here. */
export function StudyCardDeck({
  card,
  nextCard,
  direction,
  flipped,
  swipeConfig,
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
  // Drop a leading copy of the prompt the answer repeats (e.g. a verse body prefixed with its
  // reference), so the back doesn't restate the front.
  const answer = recallAnswer(prompt, direction === 'front' ? locus.back : locus.front)

  // Reset the peek hint whenever the card changes.
  useEffect(() => setPeek(false), [locus.id])

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const rotate = useTransform(x, [-260, 0, 260], [-10, 0, 10])
  const rightOpacity = useTransform(x, [36, 130], [0, 1])
  const leftOpacity = useTransform(x, [-130, -36], [1, 0])
  const upOpacity = useTransform(y, [-130, -40], [1, 0])
  const downOpacity = useTransform(y, [40, 130], [0, 1])

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

  const commit = async (dir: SwipeDirection) => {
    if (locked) return
    const action = swipeConfig[dir]
    if (action === 'none') {
      snapBack()
      return
    }
    // Flag keeps the card in place — a quick haptic tick, then spring back.
    if (!actionAdvances(action)) {
      onCommit(dir)
      tick()
      snapBack()
      return
    }
    // Grades + skip advance: fling the card off in the direction it was thrown.
    setLocked(true)
    impact()
    const off = 620
    const tx = dir === 'right' ? off : dir === 'left' ? -off : 0
    const ty = dir === 'down' ? off : dir === 'up' ? -off : 0
    const dur = reduce ? 0 : 0.24
    await Promise.all([
      tx ? animate(x, tx, { duration: dur, ease: [0.4, 0, 1, 1] }).finished : Promise.resolve(),
      ty ? animate(y, ty, { duration: dur, ease: [0.4, 0, 1, 1] }).finished : Promise.resolve(),
    ])
    onCommit(dir)
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
      if (ax >= ay) void commit(mx > 0 ? 'right' : 'left')
      else if (my < 0) void commit('up')
      else void commit('down')
    },
    { filterTaps: true, pointer: { touch: true } },
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

      <DirectionBadge
        action={swipeConfig.right}
        opacity={rightOpacity}
        className="left-5 top-5 -rotate-12"
      />
      <DirectionBadge
        action={swipeConfig.left}
        opacity={leftOpacity}
        className="right-5 top-5 rotate-12"
      />
      <DirectionBadge
        action={swipeConfig.up}
        opacity={upOpacity}
        className="left-1/2 top-4 -translate-x-1/2"
      />
      <DirectionBadge
        action={swipeConfig.down}
        opacity={downOpacity}
        className="bottom-4 left-1/2 -translate-x-1/2"
      />

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
                <div className="flex h-7 items-center justify-end gap-1.5">
                  {locus.flagged ? (
                    <Flag
                      className="size-4 fill-[var(--rating)] text-[var(--rating-edge)]"
                      aria-hidden
                    />
                  ) : null}
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
                </div>

                <div className="flex min-h-0 flex-1 scrollbar-hide flex-col items-center justify-center overflow-y-auto py-2 text-center">
                  <h2 className="text-balance break-words text-[clamp(22px,6vw,30px)] font-bold leading-[1.15] tracking-[-0.01em] text-heading">
                    {prompt}
                  </h2>
                  {locus.tip ? (
                    <div className="mt-4 flex min-h-[44px] items-center justify-center">
                      {peek ? (
                        <motion.p
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="max-w-[36ch] text-pretty text-(length:--p-text-label) italic text-muted-foreground"
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
                          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning-surface)] px-3 py-1.5 text-(length:--p-text-label) font-semibold text-[var(--warning-foreground)]"
                        >
                          <Lightbulb className="size-3.5" aria-hidden />
                          {t('study.peekHint')}
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
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

function DirectionBadge({
  action,
  opacity,
  className,
}: {
  action: FlashcardSwipeAction
  opacity: MotionValue<number>
  className: string
}) {
  const { t } = useTranslation()
  if (action === 'none') return null
  const meta = FLASHCARD_SWIPE_ACTION_META[action]
  return (
    <motion.div
      style={{ opacity }}
      className={cn(
        'pointer-events-none absolute z-30 rounded-card border-2 border-current bg-card px-3 py-1.5 text-[length:var(--p-text-sub)] font-extrabold uppercase tracking-wide',
        ACTION_TINT[action],
        className,
      )}
    >
      {t(meta.labelKey as never)}
    </motion.div>
  )
}
