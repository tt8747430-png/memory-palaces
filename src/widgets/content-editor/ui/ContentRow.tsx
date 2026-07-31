import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { cn, useLongPress } from '@/shared/lib'
import type { SwipeConfig } from '@/shared/config/swipe'
import {
  buildSwipeActions,
  FlyoutMenu,
  SelectDot,
  type SheetAction,
  type SwipeActionHandlers,
  SwipeRow,
} from '@/shared/ui'

export interface RowDragHandle {
  ref: (node: HTMLElement | null) => void
  props: Record<string, unknown>
}

/**
 * What every content row needs to sit in a list — how it is selected, dragged, swiped. A row type
 * adds only its own subject's fields on top and hands this frame through to `ContentRow`.
 */
export interface RowFrameProps {
  selectMode: boolean
  selected: boolean
  reorderable: boolean
  dragHandle?: RowDragHandle
  dragging?: boolean
  swipe: SwipeConfig
  onToggleSelect: () => void
  onRequestSelect: () => void
  onOpen?: () => void
}

export interface ContentRowProps extends RowFrameProps {
  swipeHandlers: SwipeActionHandlers
  menuActions: SheetAction[]
  children: ReactNode
}

export function ContentRow({
  selectMode,
  selected,
  reorderable,
  dragHandle,
  dragging = false,
  swipe,
  swipeHandlers,
  menuActions,
  onToggleSelect,
  onRequestSelect,
  onOpen,
  children,
}: ContentRowProps) {
  const { t } = useTranslation()
  const longPress = useLongPress({
    onLongPress: onRequestSelect,
    onTap: selectMode ? onToggleSelect : onOpen,
  })
  const { leading, trailing } = buildSwipeActions(swipe, swipeHandlers, t)

  const interaction = dragging
    ? {}
    : reorderable && dragHandle
      ? { onClick: onToggleSelect, ...dragHandle.props }
      : longPress

  const row = (
    <motion.div
      ref={!dragging && reorderable && dragHandle ? dragHandle.ref : undefined}
      initial={dragging || reorderable ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reorderable ? undefined : { opacity: 0, scale: 0.97 }}
      {...interaction}
      className={cn(
        'rounded-card border bg-card p-4 transition-colors',
        selected ? 'border-accent ring-2 ring-accent/25' : 'border-border',
        selectMode && 'cursor-pointer',
        reorderable && !dragging && 'touch-pan-y',
        dragging ? 'shadow-elevated' : 'shadow-rest',
      )}
    >
      <div className="flex items-start gap-3">
        {selectMode ? (
          <SelectDot state={selected ? 'checked' : 'unchecked'} className="mt-0.5" />
        ) : null}
        <div className="min-w-0 flex-1">{children}</div>
        {selectMode ? null : (
          <FlyoutMenu
            variant="tint"
            size="sm"
            label={t('cards.row.menuLabel')}
            actions={menuActions}
          />
        )}
      </div>
    </motion.div>
  )

  if (selectMode || dragging) return row
  return (
    <SwipeRow leading={leading} trailing={trailing} className="rounded-card">
      {row}
    </SwipeRow>
  )
}

export function RowIndex({ index, tone = 'quiet' }: { index: number; tone?: 'quiet' | 'strong' }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-bold',
        tone === 'strong'
          ? 'h-6 min-w-6 bg-primary px-1.5 text-(length:--p-text-label) text-primary-foreground'
          : 'h-5 min-w-5 bg-info-surface px-1 text-(length:--p-text-tiny) text-info-foreground',
      )}
    >
      {index + 1}
    </span>
  )
}
