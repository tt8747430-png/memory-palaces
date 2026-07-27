import { useCallback, useEffect, useRef, useState } from 'react'
import {
  animate,
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
} from './faces'
import type { StudyCard, StudyDirection } from '../model/types'

export type { SwipeDirection }

export interface StudyDeckProps {
  card: StudyCard
  /** The cards queued behind this one, nearest first — rendered for real, at most two deep. */
  upcoming?: StudyCard[]
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

/** True when the press landed in the card's scrolling body, which owns vertical movement. */
function isScroller(target: EventTarget | null): boolean {
  return Boolean((target as HTMLElement | null)?.closest('[data-card-scroll]'))
}

function swipeAllowed(target: EventTarget | null): boolean {
  const control = controlOf(target)
  return control === null || control.hasAttribute('data-flip')
}

const LONG_PRESS_MS = 450
const LONG_PRESS_SLOP = 12

export function StudyDeck({
  card,
  upcoming = [],
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
  const horizontalOnlyRef = useRef(false)
  const holdTimer = useRef<number | undefined>(undefined)
  const heldRef = useRef(false)

  const cardEntity = card.card
  const prompt = direction === 'front' ? cardEntity.front : cardEntity.back
  const answer = recallAnswer(prompt, direction === 'front' ? cardEntity.back : cardEntity.front)

  // Solved is a fact about *this* card. The deck no longer remounts between cards — it animates
  // the change — so it is tracked by id rather than cleared by an effect, which would leave the
  // newly promoted card reading as solved for a frame.
  const [solvedId, setSolvedId] = useState<string | null>(null)
  const solved = solvedId === cardEntity.id

  // Solving is terminal: the front already holds the whole answer, so there is nothing behind
  // it worth turning to. Only a reset reopens the card.
  const showBack = !solved && flipped

  const mechanicRef = useRef<MechanicHandlers>({})
  const registerMechanic = useCallback((handlers: MechanicHandlers | null) => {
    mechanicRef.current = handlers ?? {}
  }, [])

  const handleFlip = useCallback(() => {
    if (!solved) onFlip()
  }, [solved, onFlip])

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-260, 0, 260], [-10, 0, 10])

  // Two cards of depth is all the stack can show and all it needs to: any more is hidden behind
  // the two in front of it, and every one of them is a live subscription to a card.
  const behind = upcoming.slice(0, 2)

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
    // Hand the card over and drop the slot back to centre in the same tick: the card that flew
    // away has already unmounted, and the one taking its place enters from the deck itself.
    onCommit(dir)
    x.jump(0)
    y.jump(0)
    setLocked(false)
  }

  const bind = useDrag(
    ({ first, down, movement: [mx, my], velocity: [vx, vy], tap, event }) => {
      if (locked) return
      if (first) {
        armedRef.current = swipeAllowed(event.target)
        // A press inside the scrolling body still swipes sideways, but its vertical movement
        // belongs to the browser — otherwise a long answer costs the learner every swipe.
        horizontalOnlyRef.current = isScroller(event.target)
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

      const horizontalOnly = horizontalOnlyRef.current
      const ax = Math.abs(mx)
      const ay = Math.abs(my)
      if (ax > LONG_PRESS_SLOP || ay > LONG_PRESS_SLOP) clearHold()
      if (down) {
        x.set(mx)
        if (!horizontalOnly) y.set(my)
        return
      }
      clearHold()
      if (heldRef.current) {
        heldRef.current = false
        snapBack()
        return
      }
      const fling = (horizontalOnly ? vx : Math.max(vx, vy)) > 0.5
      if (ax < 80 && (horizontalOnly || ay < 80) && !fling) {
        snapBack()
        return
      }
      if (horizontalOnly && ax < ay) {
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
      setSolvedId(cardEntity.id)
      onReveal()
    },
    onHideInPlace: () => {
      setSolvedId(null)
      onUnflip()
    },
    onChangeMode,
    onOpenGear,
    registerMechanic,
  }
  const backProps: FaceProps = { ...faceProps, active: showBack }

  const front = <FrontFace {...faceProps} />
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
      {/* The deck under the card in play: the real next cards, carrying their own prompts, so
          advancing promotes something that was already there instead of dealing from nowhere.
          Rendered deepest-first and inert — only the front card takes a touch. */}
      {behind.map((queued, i) => (
        <QueuedCard
          key={queued.card.id}
          card={queued}
          mode={mode}
          direction={direction}
          canSpeak={canSpeak}
          wordSpaces={wordSpaces}
          typeInitialsOnly={typeInitialsOnly}
          // `behind` is nearest-first, so depth counts up with the index. Inverting this draws
          // the *furthest* card in the visible slot — you peek at one card and get another.
          depth={i + 1}
          reduce={Boolean(reduce)}
        />
      ))}

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
        style={{ x, y, rotate, touchAction: 'pan-y' }}
        className="relative z-10 h-full"
      >
        {/* Keyed by card, so advancing swaps the child outright — the one leaving has already
            been flung off screen and has nothing left to say. The card arriving enters from the
            pose it was just sitting in one layer down, which is what makes it read as rising out
            of the deck rather than fading in over it. */}
        <motion.div
          key={cardEntity.id}
          initial={reduce ? false : DEPTH_POSE[1]}
          animate={DEPTH_POSE[0]}
          transition={reduce ? { duration: 0 } : PROMOTION}
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
      </motion.div>
    </div>
  )
}

/**
 * Where each card in the deck sits. Depth 0 is the card in play; the rest are stepped back and
 * down so the stack has a readable edge without the pile ever looking like a fan of paper.
 */
const DEPTH_POSE = [
  { scale: 1, y: 0, opacity: 1 },
  { scale: 0.95, y: 14, opacity: 1 },
  { scale: 0.9, y: 26, opacity: 0.72 },
] as const

/** Fast enough to feel like the same gesture, slow enough to see the card arrive. */
const PROMOTION = { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as const

/**
 * The face a card leads with in the current mode. One function for the card in play and for the
 * cards queued behind it, so promoting a card changes nothing about what is on screen except its
 * pose — there is no placeholder to cross-fade out of.
 */
function FrontFace(props: FaceProps) {
  if (props.mode === 'type') return <TypeFace {...props} />
  if (props.mode === 'words') return <RebuildFace {...props} />
  return <PromptFace {...props} />
}

const noop = () => {}

/**
 * A card waiting its turn: the real card, rendered as the same full face it will be when it
 * reaches the top — header, footer, mode controls and all — just inert and one step further
 * back. It is seen through the sliver the card above leaves and, for a moment, in full while
 * that card is flung away, and in neither case should it look like a different kind of thing.
 * Its handlers are no-ops: only the card in play may act.
 */
function QueuedCard({
  card,
  mode,
  direction,
  canSpeak,
  wordSpaces,
  typeInitialsOnly,
  depth,
  reduce,
}: {
  card: StudyCard
  mode: StudyMode
  direction: StudyDirection
  canSpeak: boolean
  wordSpaces: boolean
  typeInitialsOnly: boolean
  depth: number
  reduce: boolean
}) {
  const prompt = direction === 'front' ? card.card.front : card.card.back
  const answer = recallAnswer(prompt, direction === 'front' ? card.card.back : card.card.front)
  const pose = DEPTH_POSE[Math.min(depth, DEPTH_POSE.length - 1)]!

  return (
    <motion.div
      aria-hidden
      inert
      initial={reduce ? false : DEPTH_POSE[Math.min(depth + 1, DEPTH_POSE.length - 1)]}
      animate={pose}
      transition={reduce ? { duration: 0 } : PROMOTION}
      style={{ zIndex: -depth }}
      className="pointer-events-none absolute inset-0"
    >
      <FrontFace
        card={card}
        mode={mode}
        prompt={prompt}
        answer={answer}
        canSpeak={canSpeak}
        wordSpaces={wordSpaces}
        typeInitialsOnly={typeInitialsOnly}
        active={false}
        onSpeak={noop}
        onFlip={noop}
        onRevealInPlace={noop}
        onHideInPlace={noop}
        onChangeMode={noop}
        onOpenGear={noop}
      />
    </motion.div>
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
