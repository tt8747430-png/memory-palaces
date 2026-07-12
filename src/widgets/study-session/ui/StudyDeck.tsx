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
  flipped: boolean
  swipeConfig: FlashcardSwipeConfig
  canSpeak: boolean
  onFlip: () => void
  onReveal: () => void
  onUnflip: () => void
  onCommit: (direction: SwipeDirection) => void
  onSpeak: (text: string) => void
  onChangeMode: () => void
  onOpenGear: () => void
  onLongPress?: () => void
}

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

function actionAdvances(action: FlashcardSwipeAction): boolean {
  return isGradeAction(action) || action === 'skip'
}

function controlOf(target: EventTarget | null): HTMLElement | null {
  return (
    (target as HTMLElement | null)?.closest<HTMLElement>(
      'button, input, textarea, a, select, [role="button"], [data-card-control]',
    ) ?? null
  )
}

function isControl(target: EventTarget | null): boolean {
  return controlOf(target) !== null
}

function isScroller(target: EventTarget | null): boolean {
  return Boolean((target as HTMLElement | null)?.closest('[data-card-scroll]'))
}

function swipeAllowed(target: EventTarget | null): boolean {
  if (isScroller(target)) return false
  const control = controlOf(target)
  return control === null || control.hasAttribute('data-flip')
}

const LONG_PRESS_MS = 450
const LONG_PRESS_SLOP = 12

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

  const [solved, setSolved] = useState(false)
  const [peek, setPeek] = useState(false)
  useEffect(() => {
    setSolved(false)
    setPeek(false)
  }, [cardEntity.id, mode])
  const showBack = solved ? peek : flipped

  const mechanicRef = useRef<MechanicHandlers>({})
  const registerMechanic = useCallback((handlers: MechanicHandlers | null) => {
    mechanicRef.current = handlers ?? {}
  }, [])

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
    if (isModeAction(action)) {
      mechanicRef.current[action]?.()
      tick()
      snapBack()
      return
    }
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
        if (!isControl(event.target)) handleFlip()
        return
      }
      if (!armedRef.current) return
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
