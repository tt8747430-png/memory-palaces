import { motion } from 'motion/react'
import type { StudyMode } from '@/entities/preferences'
import { recallAnswer } from '@/shared/lib'
import { FrontFace } from './faces'
import { DEPTH_POSE, poseAt, PROMOTION } from './deck-poses'
import type { StudyCard, StudyDirection } from '../model/types'

export interface QueuedCardProps {
  card: StudyCard
  mode: StudyMode
  direction: StudyDirection
  canSpeak: boolean
  wordSpaces: boolean
  typeInitialsOnly: boolean
  depth: number
  reduce: boolean
}

const noop = () => {}

/**
 * A card waiting its turn: the real card, rendered as the same full face it will be when it
 * reaches the top — header, footer, mode controls and all — just inert and one step further
 * back. It is seen through the sliver the card above leaves and, for a moment, in full while
 * that card is flung away, and in neither case should it look like a different kind of thing.
 * Its handlers are no-ops: only the card in play may act.
 */
export function QueuedCard({
  card,
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
      initial={reduce ? false : DEPTH_POSE[Math.min(depth + 1, DEPTH_POSE.length - 1)]}
      animate={poseAt(depth)}
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
