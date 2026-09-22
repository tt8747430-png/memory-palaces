import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import {
  railsFit,
  type SwipeConfig,
  type SwipeItemType,
  withoutSwipeAction,
} from '@/shared/config/swipe'
import { SortableRow } from '@/shared/ui'
import { flatToRails, isRow, ROW, type RailItem, railsToFlat } from '../model/action-rails'
import { useSortableList } from '../model/use-sortable-list'
import { ActionFace } from './ActionFace'
import { SortableActionSlot } from './SortableActionSlot'
import { SWIPE_TYPE_ICON } from './swipe-type-icon'

export interface SwipeRailsBarProps {
  type: SwipeItemType
  config: SwipeConfig
  onChange: (config: SwipeConfig) => void
}

/**
 * A row of this kind with both its swipes open, at the size and in the colours the real rails wear —
 * and live. Dragging a cap past the row is what moves it to the other side, which is also what the
 * gesture it configures means, so the picture and the control are one thing.
 *
 * The two rails and the row are one list with the row standing between them (`action-rails.ts`).
 * That is what lets an ordinary sortable list say "reorder", "change sides" and "how many each rail
 * holds" at once, rather than two lists and a cross-container drag. Each cap's badge takes it off
 * whichever side it is on.
 */
export function SwipeRailsBar({ type, config, onChange }: SwipeRailsBarProps) {
  // A drop that would overfill a rail is refused: a row only has so much width to open, and trimming
  // instead would take an action off the rails without the learner asking.
  const list = useSortableList<RailItem>({
    ids: railsToFlat(config),
    onDrop: (next) => {
      const rails = flatToRails(next)
      if (!railsFit(rails)) return false
      onChange(rails)
    },
  })

  const rails = flatToRails(list.items)

  return (
    <DndContext {...list.dnd}>
      <SortableContext items={[...list.items]} strategy={horizontalListSortingStrategy}>
        {/* A badge hangs a few pixels off its cap's corner: the gap and the top padding keep it off
            the next cap and inside the box, not decoration (CODE_STYLE §5). */}
        <div className="flex items-center gap-2 pt-1">
          {/* An empty rail keeps its place. Without it the row slides to the edge the moment a side
              is cleared, and there is nothing to say a side is there to drag onto. */}
          {rails.leading.length === 0 ? <EmptyRail /> : null}
          {list.items.map((item) =>
            isRow(item) ? (
              <SampleRow key={item} type={type} />
            ) : (
              <SortableActionSlot
                key={item}
                action={item}
                className="shrink-0"
                onRemove={() => onChange(withoutSwipeAction(rails, item))}
              >
                <ActionFace action={item} />
              </SortableActionSlot>
            ),
          )}
          {rails.trailing.length === 0 ? <EmptyRail /> : null}
        </div>
      </SortableContext>

      <DragOverlay {...list.overlay}>
        {list.activeId && !isRow(list.activeId) ? (
          <ActionFace action={list.activeId} floating />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

/** Where a rail would be. Inert: it marks the side, and the drop is decided against the row. */
function EmptyRail() {
  return (
    <span
      aria-hidden
      className="size-9 shrink-0 rounded-tile-slot border-2 border-dashed border-border"
    />
  )
}

/**
 * The row itself. A sortable of the list like any other item — caps pass it to change sides — but it
 * cannot be picked up: a row is where it is, and the only thing dragging it could mean is already
 * said by dragging a cap.
 */
function SampleRow({ type }: { type: SwipeItemType }) {
  const { t } = useTranslation()
  const Icon = SWIPE_TYPE_ICON[type]
  return (
    <SortableRow id={ROW} disabled className="min-w-0 flex-1">
      {() => (
        <span className="flex min-w-0 items-center gap-2.5 rounded-card bg-card px-3 py-2.5 shadow-rest">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-control bg-info-surface text-primary"
          >
            <Icon className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate text-body font-semibold text-heading">
            {t(`swipe.sample.${type}` as never)}
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </span>
      )}
    </SortableRow>
  )
}
