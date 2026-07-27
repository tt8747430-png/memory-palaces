import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { cn, useLongPress } from '@/shared/lib'
import type { SwipeConfig } from '@/shared/config/swipe'
import {
  buildSwipeActions,
  OverflowMenuButton,
  SelectDot,
  type SheetAction,
  type SwipeActionHandlers,
  SwipeRow,
} from '@/shared/ui'

export interface RowDragHandle {
  ref: (node: HTMLElement | null) => void
  props: Record<string, unknown>
}

export interface ContentRowProps {
  selectMode: boolean
  selected: boolean
  reorderable: boolean
  dragHandle?: RowDragHandle
  dragging?: boolean
  swipe: SwipeConfig
  swipeHandlers: SwipeActionHandlers
  menuActions: SheetAction[]
  onToggleSelect: () => void
  onRequestSelect: () => void
  /** What a plain tap does outside select mode. A Question has nothing to open. */
  onOpen?: () => void
  children: ReactNode
}

/**
 * The frame every row in a Deck's content list wears: the surface, the selection affordance, the
 * overflow menu, the swipe actions, and how a press is interpreted — a tap, a hold that starts a
 * Selection, or a drag once reordering is on. Only the body between them differs by row type.
 *
 * Gathering it here is what keeps the drop-flicker rules (`docs/CODE_STYLE.md` §10) true for
 * every row at once instead of once per copy.
 */
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

  // While a row is being dragged it answers to the drag and nothing else; while it is reorderable
  // it is also in select mode, so a tap picks it rather than opening it.
  const interaction = dragging
    ? {}
    : reorderable && dragHandle
      ? { onClick: onToggleSelect, ...dragHandle.props }
      : longPress

  const row = (
    <motion.div
      ref={!dragging && reorderable && dragHandle ? dragHandle.ref : undefined}
      // No mount entrance on a drag surface. A row carried in a stack is unmounted for the length
      // of the drag and remounts when the block lands, so an entrance here would animate `opacity`
      // on the landing row — the fourth cause of drop flicker (`docs/CODE_STYLE.md` §10) — and
      // fight the travel `useStackLanding` is already running on it.
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
          <OverflowMenuButton
            variant="tint"
            size="sm"
            label={t('cards.row.menuLabel')}
            actions={menuActions}
          />
        )}
      </div>
    </motion.div>
  )

  // A swipe would fight both the selection tap and the drag, so it only exists at rest.
  if (selectMode || dragging) return row
  return (
    <SwipeRow leading={leading} trailing={trailing} className="rounded-card">
      {row}
    </SwipeRow>
  )
}

/** The position badge every content row leads with. */
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
