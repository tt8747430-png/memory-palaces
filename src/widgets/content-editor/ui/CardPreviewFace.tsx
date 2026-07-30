import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Flag, Lightbulb, MapPin } from 'lucide-react'
import type { Card } from '@/entities/card'
import { poseAt } from '@/shared/lib'
import { CARD_EASE, DEPTH_POSE } from './browser-poses'

const FACE_SURFACE =
  'absolute inset-0 flex flex-col rounded-card-featured border border-border bg-card p-6 shadow-elevated'

export function PreviewFace({ card, back = false }: { card: Card; back?: boolean }) {
  const { t } = useTranslation()

  if (!back) {
    return (
      <div style={{ backfaceVisibility: 'hidden' }} className={FACE_SURFACE}>
        <div className="flex items-center justify-between">
          <FaceTag>{t('cards.browser.front')}</FaceTag>
          {card.flagged ? (
            <Flag
              className="size-4 fill-rating text-rating-edge"
              aria-label={t('cards.row.flagged')}
            />
          ) : null}
        </div>
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-1 py-3 text-center scrollbar-hide">
          <p className="text-balance wrap-break-wordword text-[clamp(24px,6.5vw,34px)] font-bold leading-tight text-heading">
            {card.front}
          </p>
        </div>
        <FaceHint>{t('cards.browser.flip')}</FaceHint>
      </div>
    )
  }

  return (
    <div
      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      className={FACE_SURFACE}
    >
      <FaceTag className="self-start">{t('cards.browser.back')}</FaceTag>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto py-3 text-center scrollbar-hide">
        <p className="text-balance wrap-break-word text-[clamp(18px,5vw,24px)] font-semibold leading-snug text-heading">
          {card.back}
        </p>
        {card.hint ? (
          <p className="flex max-w-[34ch] items-center gap-1.5 text-(length:--p-text-label) italic leading-relaxed text-accent">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {card.hint}
          </p>
        ) : null}
        {card.tip ? (
          <p className="flex max-w-[34ch] items-center gap-1.5 rounded-control bg-(--warning-surface) px-3 py-1.5 text-(length:--p-text-label) italic leading-relaxed text-(--warning-foreground)">
            <Lightbulb className="size-3.5 shrink-0" aria-hidden />
            {card.tip}
          </p>
        ) : null}
      </div>
      <FaceHint>{t('cards.browser.flipBack')}</FaceHint>
    </div>
  )
}

function FaceTag({ children, className = '' }: { children: string; className?: string }) {
  return (
    <span
      className={`rounded-control bg-info-surface px-2.5 py-1 text-(length:--p-text-tiny) font-semibold text-info-foreground ${className}`}
    >
      {children}
    </span>
  )
}

function FaceHint({ children }: { children: string }) {
  return (
    <p className="text-center text-(length:--p-text-label) font-medium text-muted-foreground">
      {children}
    </p>
  )
}

export function QueuedPreview({
  card,
  depth,
  reduce,
}: {
  card: Card
  depth: number
  reduce: boolean
}) {
  return (
    <motion.div
      aria-hidden
      inert
      initial={reduce ? false : poseAt(DEPTH_POSE, depth + 1)}
      animate={poseAt(DEPTH_POSE, depth)}
      transition={reduce ? { duration: 0 } : { duration: 0.3, ease: CARD_EASE }}
      style={{ zIndex: -depth }}
      className="pointer-events-none absolute inset-0"
    >
      <PreviewFace card={card} />
    </motion.div>
  )
}
