import { useCallback, useRef, useState } from 'react'
import { type HTMLMotionProps, motion, useReducedMotion } from 'motion/react'
import type { StudyMode } from '@/entities/preferences'
import { EASE_EXPO, recallAnswer } from '@/shared/lib'
import type { FlashcardSwipeConfig, SwipeDirection } from '@/shared/config/flashcard-swipe'
import { BackFace, type FaceProps, FrontFace, type MechanicHandlers } from './faces'
import { DEPTH_POSE, PROMOTION, STACK_DEPTH } from './deck-poses'
import { DirectionChip } from './DirectionChip'
import { QueuedCard } from './QueuedCard'
import { useCardSwipe } from '../model/use-card-swipe'
import type { StudyCard, StudyDirection } from '../model/types'

export type { SwipeDirection }

const CHIPS: { dir: SwipeDirection; className: string }[] = [
  { dir: 'right', className: 'left-5 top-5 -rotate-12' },
  { dir: 'left', className: 'right-5 top-5 rotate-12' },
  { dir: 'up', className: 'left-1/2 top-4 -translate-x-1/2' },
  { dir: 'down', className: 'bottom-4 left-1/2 -translate-x-1/2' },
]

export interface StudyDeckProps {
  card: StudyCard
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
  const cardEntity = card.card
  const prompt = direction === 'front' ? cardEntity.front : cardEntity.back
  const answer = recallAnswer(prompt, direction === 'front' ? cardEntity.back : cardEntity.front)

  const [solvedId, setSolvedId] = useState<string | null>(null)
  const solved = solvedId === cardEntity.id

  const showBack = !solved && flipped

  const mechanicRef = useRef<MechanicHandlers>({})
  const registerMechanic = useCallback((handlers: MechanicHandlers | null) => {
    mechanicRef.current = handlers ?? {}
  }, [])

  const handleFlip = useCallback(() => {
    if (!solved) onFlip()
  }, [solved, onFlip])

  const swipe = useCardSwipe({
    swipeConfig,
    reduce: Boolean(reduce),
    onFlip: handleFlip,
    onLongPress,
    onCommit,
    onMechanic: (action) => mechanicRef.current[action]?.(),
  })

  const behind = upcoming.slice(0, STACK_DEPTH)

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

  return (
    <div className="relative mx-auto h-full w-full max-w-md [perspective:1200px]">
      {behind.map((queued, i) => (
        <QueuedCard
          key={queued.card.id}
          card={queued}
          mode={mode}
          direction={direction}
          canSpeak={canSpeak}
          wordSpaces={wordSpaces}
          typeInitialsOnly={typeInitialsOnly}
          depth={i + 1}
          reduce={Boolean(reduce)}
        />
      ))}

      {CHIPS.map(({ dir, className }) => (
        <DirectionChip
          key={dir}
          action={swipeConfig[dir]}
          x={swipe.x}
          y={swipe.y}
          dir={dir}
          className={className}
        />
      ))}

      <motion.div
        {...(swipe.bind() as unknown as HTMLMotionProps<'div'>)}
        style={{ x: swipe.x, y: swipe.y, rotate: swipe.rotate, touchAction: 'pan-y' }}
        className="relative z-10 h-full"
      >
        <motion.div
          key={cardEntity.id}
          initial={reduce ? false : DEPTH_POSE[1]}
          animate={DEPTH_POSE[0]}
          transition={reduce ? { duration: 0 } : PROMOTION}
          className="h-full"
        >
          <motion.div
            animate={{ rotateY: showBack ? 180 : 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_EXPO }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative h-full w-full"
          >
            <FrontFace {...faceProps} />
            <BackFace {...faceProps} active={showBack} />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
