import { type ReactNode, useCallback, useMemo } from 'react'
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn, useHeldOrder, useSortableBlock, useSortableSensors } from '@/shared/lib'
import { type SortableHandle, SortableRow, StackedDragPreview } from '@/shared/ui'
import { useListWindow } from '../model/use-list-window'

/** The handle a lifted copy wears: it looks like the row, and nothing about it can be dragged. */
const STATIC_HANDLE: SortableHandle = { ref: () => {}, props: {} }

/** The space between rows, px — the list's `gap-3`, now owned by the window that lays rows out. */
const ROW_GAP = 12

export interface ReorderableListProps<T extends { id: string }> {
  items: readonly T[]
  reorderable: boolean
  onReorder: (orderedIds: string[]) => void
  renderItem: (item: T, handle?: SortableHandle, dragging?: boolean) => ReactNode
  selectedIds?: ReadonlySet<string>
  /** A row's height before it is measured, px. */
  estimateSize: number
}

/**
 * A deck's content list: every row in order, drawn only where the screen can see it, and — in
 * select mode — reorderable as a block (ADR 0001).
 *
 * The window changes nothing about a drag. `SortableContext` still holds every id; the rows out of
 * view simply are not droppables until the drag's auto-scroll brings them in, and the row under the
 * finger is kept drawn wherever it is scrolled, so the drag never loses its node.
 */
export function ReorderableList<T extends { id: string }>({
  items,
  reorderable,
  onReorder,
  renderItem,
  selectedIds,
  estimateSize,
}: ReorderableListProps<T>) {
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const itemIds = useMemo(() => items.map((item) => item.id), [items])
  const { order: orderedIds, hold } = useHeldOrder(itemIds)

  const sensors = useSortableSensors()
  const sectionOf = useCallback(() => orderedIds, [orderedIds])
  const drag = useSortableBlock({ sectionOf, selectedIds })
  const front = drag.stackIds[0] ? byId.get(drag.stackIds[0]) : undefined

  // Browsing draws the list as it comes; arranging draws the held order, less the rows riding
  // along under the one being dragged.
  const shown = useMemo(
    () => (reorderable ? orderedIds.filter((id) => !drag.isHidden(id) && byId.has(id)) : itemIds),
    [reorderable, orderedIds, itemIds, drag, byId],
  )

  const view = useListWindow({
    ids: shown,
    estimateSize,
    gap: ROW_GAP,
    keep: drag.activeId,
  })

  const body = (
    <div ref={view.listRef} className="relative w-full" style={{ height: view.height }}>
      {view.rows.map((row) => {
        const item = byId.get(shown[row.index] ?? '')
        if (!item) return null
        return (
          <div
            key={row.key}
            ref={view.measure}
            data-index={row.index}
            className="absolute inset-x-0 top-0"
            style={{ transform: `translateY(${view.offsetOf(row)}px)` }}
          >
            {reorderable ? (
              <SortableRow id={item.id} landingRef={drag.landingRef(item.id)}>
                {({ frameRef, handle, isDragging }) => (
                  <div ref={frameRef} className={cn(isDragging && 'opacity-0')}>
                    {renderItem(item, handle)}
                  </div>
                )}
              </SortableRow>
            ) : (
              renderItem(item)
            )}
          </div>
        )
      })}
    </div>
  )

  if (!reorderable) return body

  const handleDragEnd = (event: DragEndEvent) => {
    const result = drag.drop(event)
    if (!result) return
    hold(result.order)
    onReorder(result.order)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={drag.collision}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={(event: DragStartEvent) => drag.start(String(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={drag.cancel}
    >
      <SortableContext items={shown as string[]} strategy={verticalListSortingStrategy}>
        {body}
      </SortableContext>

      <DragOverlay dropAnimation={drag.dropAnimation}>
        {front ? (
          <StackedDragPreview
            count={drag.carriedIds.size}
            layers={drag.stackIds.slice(1).map((id) => {
              const item = byId.get(id)
              return item ? <div key={id}>{renderItem(item, STATIC_HANDLE, true)}</div> : null
            })}
          >
            <div className="cursor-grabbing">{renderItem(front, STATIC_HANDLE, true)}</div>
          </StackedDragPreview>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
