import { motion } from 'motion/react'
import type { CardStyle } from '@/entities/deck'
import type { StudyMode } from '@/entities/preferences'
import { poseAt, recallAnswer } from '@/shared/lib'
import { FrontFace } from './faces'
import { DEPTH_POSE, PROMOTION } from './deck-poses'
import type { StudyCard, StudyDirection } from '../model/types'

export interface QueuedCardProps {
  card: StudyCard
  cardStyle: CardStyle
  mode: StudyMode
  direction: StudyDirection
  canSpeak: boolean
  wordSpaces: boolean
  typeInitialsOnly: boolean
  depth: number
  reduce: boolean
}

const noop = () => {}

export function QueuedCard({
  card,
  cardStyle,
  mode,
  direction,
  canSpeak,
  wordSpaces,
  typeInitialsOnly,
  depth,
  reduce,
}: QueuedCardProps) {
  const prompt = direction === 'front' ? card.card.front : card.card.back
  const answer = recallAnswer(prompt, direction === 'front' ? card.card.back : card.card.front)

  return (
    <motion.div
      aria-hidden
      inert
      initial={reduce ? false : poseAt(DEPTH_POSE, depth + 1)}
      animate={poseAt(DEPTH_POSE, depth)}
      transition={reduce ? { duration: 0 } : PROMOTION}
      style={{ zIndex: -depth }}
      className="pointer-events-none absolute inset-0"
    >
      <FrontFace
        card={card}
        cardStyle={cardStyle}
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
