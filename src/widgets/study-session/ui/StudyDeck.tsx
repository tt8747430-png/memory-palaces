import { useCallback, useEffect, useRef, useState } from 'react'
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
import { useTranslation } from 'react-i18next'
import type { StudyMode } from '@/entities/preferences'
import { cn, impact, recallAnswer, tick } from '@/shared/lib'
import {
  type FlashcardSwipeAction,
  FLASHCARD_SWIPE_ACTION_META,
  type FlashcardSwipeConfig,
  isGradeAction,
  isModeAction,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import {
  AnswerFace,
  BlurFace,
  type FaceProps,
  InitialsFace,
  type MechanicHandlers,
  PromptFace,
  RebuildFace,
  TypeFace,
} from './card-faces'
import type { StudyCard, StudyDirection } from '../model/types'

export type { SwipeDirection }

export interface StudyDeckProps {
  card: StudyCard
  nextCard?: StudyCard
  mode: StudyMode
  direction: StudyDirection
  wordSpaces: boolean
  typeInitialsOnly: boolean
  /** The session machine's flip flag (grades in the footer). A solved card keeps its working
   * surface up (see `solved`/`peek`); a normal flip turns it to the back. */
  flipped: boolean
  swipeConfig: FlashcardSwipeConfig
  canSpeak: boolean
  onFlip: () => void
  onReveal: () => void
  /** Undo an in-place reveal (Rebuild reset, Type hide) — returns the card to its front. */
  onUnflip: () => void
  onCommit: (direction: SwipeDirection) => void
  onSpeak: (text: string) => void
  /** Open the study-mode picker — the footer's left control. */
  onChangeMode: () => void
  /** Open the merged gear sheet — the footer's right control. */
  onOpenGear: () => void
  onLongPress?: () => void
}

/** Text tint per swipe action, matching the grade-button palette. Mode-specific actions read in
 * the neutral heading tint (they act on the card, not the schedule). `none` renders no chip. */
const ACTION_TINT: Record<Exclude<FlashcardSwipeAction, 'none'>, string> = {
  again: 'text-[var(--danger-on-surface)]',
  hard: 'text-[var(--warning-foreground)]',
  good: 'text-[var(--success-on-surface)]',
  easy: 'text-[var(--accent)]',
  flag: 'text-[var(--rating-edge)]',
  skip: 'text-muted-foreground',
  hideMore: 'text-heading',
  showAll: 'text-heading',
  showWords: 'text-heading',
  reset: 'text-heading',
  nextWord: 'text-heading',
}

/** Actions that leave the current card (grades + skip). Flag/none/mode-specific keep it. */
function actionAdvances(action: FlashcardSwipeAction): boolean {
  return isGradeAction(action) || action === 'skip'
}

/** The interactive element a gesture began on, if any. `data-card-control` covers surfaces that
 * are controls without a native control tag (the first-letters input area). */
function controlOf(target: EventTarget | null): HTMLElement | null {
  return (
    (target as HTMLElement | null)?.closest<HTMLElement>(
      'button, input, textarea, a, select, [role="button"], [data-card-control]',
    ) ?? null
  )
}

/** A tap on any interactive element runs that element, not a card flip. */
function isControl(target: EventTarget | null): boolean {
  return controlOf(target) !== null
}

/** A gesture that begins inside a scrolling body pans it to read; swipe stays out of the way. */
function isScroller(target: EventTarget | null): boolean {
  return Boolean((target as HTMLElement | null)?.closest('[data-card-scroll]'))
}

/** Whether a fling may start here: anywhere except a real control (an input, a word chip) or a
 * scrolling body. The full-card flip button is marked `data-flip`, so swipe passes through it. */
function swipeAllowed(target: EventTarget | null): boolean {
  if (isScroller(target)) return false
  const control = controlOf(target)
  return control === null || control.hasAttribute('data-flip')
}

/** How long a still press must hold before it opens quick actions. */
const LONG_PRESS_MS = 450
/** Finger drift allowed during the hold before it's read as a swipe, not a press. */
const LONG_PRESS_SLOP = 12

/** The unified study deck: one swipeable, two-faced card behind every mode. Tap a
 * non-interactive area to flip (or, once solved in place, to peek the answer and back), fling to
 * grade/skip/flag or run this mode's own action, press-and-hold for quick actions. The parent
 * maps `onCommit(direction)` through the active mode's swipe config; mode-specific actions are
 * dispatched to the active face's registered mechanic. */
export function StudyDeck({
  card,
  nextCard,
  mode,
  direction,
  wordSpaces,
  typeInitialsOnly,
  flipped,
  swipeConfig,
  canSpeak,
  onFlip,
  onReveal,
  onUnflip,
  onCommit,
  onSpeak,
  onChangeMode,
  onOpenGear,
  onLongPress,
}: StudyDeckProps) {
  const reduce = useReducedMotion()
  const [locked, setLocked] = useState(false)
  const armedRef = useRef(true)
  const holdTimer = useRef<number | undefined>(undefined)
  const heldRef = useRef(false)

  const cardEntity = card.card
  const prompt = direction === 'front' ? cardEntity.front : cardEntity.back
  const answer = recallAnswer(prompt, direction === 'front' ? cardEntity.back : cardEntity.front)

  // A solved Type/Rebuild reveals the grades without turning the card, so the reconstruction
  // stays in view; tapping then peeks the answer face. Both reset when the card or mode changes.
  const [solved, setSolved] = useState(false)
  const [peek, setPeek] = useState(false)
  useEffect(() => {
    setSolved(false)
    setPeek(false)
  }, [cardEntity.id, mode])
  const showBack = solved ? peek : flipped

  // Mode-specific swipe mechanics published by the active face (Blur hide, Type next word, …).
  const mechanicRef = useRef<MechanicHandlers>({})
  const registerMechanic = useCallback((handlers: MechanicHandlers | null) => {
    mechanicRef.current = handlers ?? {}
  }, [])

  // Tap / FlipZone / BackPrompt all route here so flipping respects the solved state: a solved
  // card peeks the answer instead of un-revealing.
  const handleFlip = useCallback(() => {
    if (solved) setPeek((prev) => !prev)
    else onFlip()
  }, [solved, onFlip])

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const rotate = useTransform(x, [-260, 0, 260], [-10, 0, 10])

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
    // A mode-specific action runs the active face's mechanic in place — a tick, then spring back.
    if (isModeAction(action)) {
      mechanicRef.current[action]?.()
      tick()
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
    ({ first, down, movement: [mx, my], velocity: [vx, vy], tap, event }) => {
      if (locked) return
      if (first) {
        armedRef.current = swipeAllowed(event.target)
        heldRef.current = false
        clearHold()
        // Long-press opens quick actions — only where a swipe could have started.
        if (armedRef.current) {
          holdTimer.current = window.setTimeout(() => {
            heldRef.current = true
            impact()
            onLongPress?.()
          }, LONG_PRESS_MS)
        }
      }
      if (tap) {
        clearHold()
        if (heldRef.current) {
          heldRef.current = false
          return
        }
        // Tap any non-interactive area to flip (or peek, once solved).
        if (!isControl(event.target)) handleFlip()
        return
      }
      if (!armedRef.current) return
      // Cancel the pending long-press only once the finger has clearly moved (a real drag),
      // so a still thumb with minor jitter still opens quick actions.
      if (Math.abs(mx) > LONG_PRESS_SLOP || Math.abs(my) > LONG_PRESS_SLOP) clearHold()
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

  const faceProps: FaceProps = {
    card,
    mode,
    prompt,
    answer,
    canSpeak,
    wordSpaces,
    typeInitialsOnly,
    active: !showBack,
    onSpeak,
    onFlip: handleFlip,
    onRevealInPlace: () => {
      setSolved(true)
      setPeek(false)
      onReveal()
    },
    onHideInPlace: () => {
      setSolved(false)
      setPeek(false)
      onUnflip()
    },
    onChangeMode,
    onOpenGear,
    registerMechanic,
  }
  const backProps: FaceProps = { ...faceProps, active: showBack }

  const front =
    mode === 'type' ? (
      <TypeFace {...faceProps} />
    ) : mode === 'words' ? (
      <RebuildFace {...faceProps} />
    ) : (
      <PromptFace {...faceProps} />
    )
  const back =
    mode === 'blur' ? (
      <BlurFace {...backProps} />
    ) : mode === 'initials' ? (
      <InitialsFace {...backProps} />
    ) : (
      <AnswerFace {...backProps} />
    )

  return (
    <div className="relative mx-auto h-full w-full max-w-md [perspective:1200px]">
      {nextCard ? (
        <div
          aria-hidden
          className="absolute inset-x-2 top-3 -z-0 h-full rounded-card-featured bg-card-glass shadow-rest"
          style={{ transform: 'translateY(12px) scale(0.95)' }}
        />
      ) : null}

      <DirectionChip
        action={swipeConfig.right}
        x={x}
        y={y}
        dir="right"
        className="left-5 top-5 -rotate-12"
      />
      <DirectionChip
        action={swipeConfig.left}
        x={x}
        y={y}
        dir="left"
        className="right-5 top-5 rotate-12"
      />
      <DirectionChip
        action={swipeConfig.up}
        x={x}
        y={y}
        dir="up"
        className="left-1/2 top-4 -translate-x-1/2"
      />
      <DirectionChip
        action={swipeConfig.down}
        x={x}
        y={y}
        dir="down"
        className="bottom-4 left-1/2 -translate-x-1/2"
      />

      <motion.div
        {...(bind() as unknown as HTMLMotionProps<'div'>)}
        style={{ x, y, rotate, scale, touchAction: 'pan-y' }}
        className="relative z-10 h-full"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={cardEntity.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <motion.div
              animate={{ rotateY: showBack ? 180 : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative h-full w-full"
            >
              {front}
              {back}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/** One direction's swipe chip. Its opacity is driven so only the dominant direction shows —
 * a diagonal drag never lights two chips at once. */
function DirectionChip({
  action,
  x,
  y,
  dir,
  className,
}: {
  action: FlashcardSwipeAction
  x: MotionValue<number>
  y: MotionValue<number>
  dir: SwipeDirection
  className: string
}) {
  const { t } = useTranslation()
  const opacity = useTransform([x, y], ([px = 0, py = 0]: number[]) => {
    const ax = Math.abs(px)
    const ay = Math.abs(py)
    const horizontal = ax >= ay
    // Light only for the drag's dominant axis and its direction, so a diagonal never shows two.
    const lit =
      dir === 'right'
        ? horizontal && px > 0
        : dir === 'left'
          ? horizontal && px < 0
          : dir === 'up'
            ? !horizontal && py < 0
            : !horizontal && py > 0
    if (!lit) return 0
    return Math.min(Math.max(((horizontal ? ax : ay) - 36) / 94, 0), 1)
  })

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
