import { type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react'
import { cn, useLongPress } from '@/shared/lib'
import type { SwipeConfig } from '@/shared/config/swipe'
import {
  buildSwipeActions,
  FlyoutMenu,
  IconButton,
  SelectDot,
  type SortableHandle,
  type SheetAction,
  type ActionHandlers,
  SwipeRow,
} from '@/shared/ui'

/**
 * What a row reports, by id. One object for the whole list, stable for its life
 * (`useStableHandlers`): a row is memoized, and a fresh closure per row per render would re-render
 * every row on every render of the list.
 */
export interface RowEvents {
  toggleSelect: (id: string) => void
  requestSelect: (id: string) => void
  /** Absent where a tap on the row opens nothing. */
  open?: (id: string) => void
}

export interface RowFrameProps {
  id: string
  selectMode: boolean
  selected: boolean
  reorderable: boolean
  dragHandle?: SortableHandle
  dragging?: boolean
  swipe: SwipeConfig
  events: RowEvents
}

export type RowOverflow =
  { kind: 'menu'; actions: SheetAction[] } | { kind: 'sheet'; onOpen: () => void }

export interface ContentRowProps extends RowFrameProps {
  swipeHandlers: ActionHandlers
  overflow: RowOverflow
  children: ReactNode
}

/**
 * A row of the deck's content: the card surface, the select dot, the overflow control and the
 * swipe rails around whatever the row shows. It does not animate in — the list draws only the rows
 * in view, so an entrance would replay on every row a scroll brings in.
 */
export function ContentRow({
  id,
  selectMode,
  selected,
  reorderable,
  dragHandle,
  dragging = false,
  swipe,
  events,
  swipeHandlers,
  overflow,
  children,
}: ContentRowProps) {
  const { t } = useTranslation()
  const toggle = () => events.toggleSelect(id)
  // A tap selects in select mode, opens the row otherwise — or does nothing where there is nothing
  // to open.
  const tap = () => {
    if (selectMode) return toggle
    const open = events.open
    return open ? () => open(id) : undefined
  }
  const longPress = useLongPress({
    onLongPress: () => events.requestSelect(id),
    onTap: tap(),
  })
  const { leading, trailing } = useMemo(
    () => buildSwipeActions(swipe, swipeHandlers, t),
    [swipe, swipeHandlers, t],
  )

  const interaction = dragging
    ? {}
    : reorderable && dragHandle
      ? { onClick: toggle, ...dragHandle.props }
      : longPress

  const row = (
    <div
      ref={!dragging && reorderable && dragHandle ? dragHandle.ref : undefined}
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
        {selectMode ? null : overflow.kind === 'sheet' ? (
          <IconButton
            variant="tint"
            size="sm"
            aria-label={t('cards.row.menuLabel')}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              overflow.onOpen()
            }}
          >
            <MoreVertical className="size-4.5" aria-hidden />
          </IconButton>
        ) : (
          <FlyoutMenu
            variant="tint"
            size="sm"
            label={t('cards.row.menuLabel')}
            actions={overflow.actions}
          />
        )}
      </div>
    </div>
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
          ? 'h-6 min-w-6 bg-primary px-1.5 text-label text-primary-foreground'
          : 'h-5 min-w-5 bg-info-surface px-1 text-tiny text-info-foreground',
      )}
    >
      {index + 1}
    </span>
  )
}
