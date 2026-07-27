import { motion, type MotionValue, useTransform } from 'motion/react'
import { useTranslation } from 'react-i18next'
import {
  type FlashcardSwipeAction,
  FLASHCARD_SWIPE_ACTION_META,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import { cn } from '@/shared/lib'

const ACTION_TINT: Record<Exclude<FlashcardSwipeAction, 'none'>, string> = {
  again: 'text-(--danger-on-surface)',
  hard: 'text-(--warning-foreground)',
  good: 'text-(--success-on-surface)',
  easy: 'text-(--accent)',
  flag: 'text-(--rating-edge)',
  skip: 'text-muted-foreground',
  hideMore: 'text-heading',
  showAll: 'text-heading',
  showWords: 'text-heading',
  reset: 'text-heading',
  nextWord: 'text-heading',
}

export interface DirectionChipProps {
  action: FlashcardSwipeAction
  x: MotionValue<number>
  y: MotionValue<number>
  dir: SwipeDirection
  className: string
}

export function DirectionChip({ action, x, y, dir, className }: DirectionChipProps) {
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
        'pointer-events-none absolute z-30 rounded-card border-2 border-current bg-card px-3 py-1.5 text-(length:--p-text-sub) font-extrabold uppercase tracking-wide',
        ACTION_TINT[action],
        className,
      )}
    >
      {t(meta.labelKey as never)}
    </motion.div>
  )
}
