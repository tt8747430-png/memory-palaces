import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn, reconcileHeldOrder, useSortableBlock, useSortableSensors } from '@/shared/lib'
import { SortableRow, StackedDragPreview } from '@/shared/ui'
import type { RowDragHandle } from './ContentRow'

const STATIC_DRAG_HANDLE: RowDragHandle = { ref: () => {}, props: {} }

/**
 * A flat reorderable list of cards or questions. The drag itself is `useSortableBlock`, shared
 * with the library — this adds only what is local to a list synced from props: holding the
 * dropped order on screen until the store agrees with it.
 */
export function ReorderableList<T extends { id: string }>({
  items,
  reorderable,
  onReorder,
  renderItem,
  selectedIds,
}: {
  items: T[]
  reorderable: boolean
  onReorder: (orderedIds: string[]) => void
  renderItem: (item: T, dragHandle?: RowDragHandle, dragging?: boolean) => ReactNode
  /** When set, dragging a selected row moves the whole selected block together. */
  selectedIds?: ReadonlySet<string>
}) {
  const [ordered, setOrdered] = useState(items)
  // A just-dropped order, held on screen until the store agrees. A reorder is one write per row,
  // so RxDB re-emits partial orders on the way to the final one; rendering those makes a multi-
  // row drop settle row-by-row (4 → 3 → 2 → 1) instead of all at once. Keep the committed order
  // until the incoming rows match it, then resume following the store — adds/removes still
  // reconcile immediately, they just slot into the held order.
  const [pendingIds, setPendingIds] = useState<string[] | null>(null)
  useEffect(() => {
    if (!pendingIds) {
      setOrdered(items)
      return
    }
    const byId = new Map(items.map((item) => [item.id, item]))
    const { order, settled } = reconcileHeldOrder(
      pendingIds,
      items.map((item) => item.id),
    )
    setOrdered(order.map((id) => byId.get(id)!))
    if (settled) setPendingIds(null)
  }, [items, pendingIds])

  const sensors = useSortableSensors()
  const orderedIds = useMemo(() => ordered.map((item) => item.id), [ordered])
  const sectionOf = useCallback(() => orderedIds, [orderedIds])
  const drag = useSortableBlock({ sectionOf, selectedIds })

  const byId = useMemo(() => new Map(ordered.map((item) => [item.id, item])), [ordered])
  const front = drag.stackIds[0] ? byId.get(drag.stackIds[0]) : undefined

  // Carried rows other than the one dnd-kit is tracking leave the flow while dragging: the stack
  // stands in for them, and only one gap opens — at the block's edge, never inside it.
  const visible = useMemo(() => ordered.filter((item) => !drag.isHidden(item.id)), [ordered, drag])

  if (!reorderable) return <>{items.map((item) => renderItem(item))}</>

  const handleDragEnd = (event: DragEndEvent) => {
    const result = drag.drop(event)
    if (!result) return
    setOrdered(result.order.map((id) => byId.get(id)!).filter(Boolean) as T[])
    setPendingIds(result.order)
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
      <SortableContext
        items={visible.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {visible.map((item) => (
            <SortableRow key={item.id} id={item.id} landingRef={drag.landingRef(item.id)}>
              {({ frameRef, handleRef, handleProps, isDragging }) => (
                // The row's own frame belongs to `renderItem`, so the hidden-source state and the
                // landing ride on a wrapper here instead — same two layers, same behaviour.
                <div ref={frameRef} className={cn(isDragging && 'opacity-0')}>
                  {renderItem(item, { ref: handleRef, props: handleProps })}
                </div>
              )}
            </SortableRow>
          ))}
        </div>
      </SortableContext>

      {/* Single drag: the row itself is in hand (the source is hidden), so it flies onto its slot.
          Multi drag: the stack clears the instant the finger lifts — its count is a fact about a
          drag that is over — and the rows it held travel to their slots on their own. */}
      <DragOverlay dropAnimation={drag.dropAnimation}>
        {front ? (
          <StackedDragPreview
            count={drag.carriedIds.size}
            layers={drag.stackIds.slice(1).map((id) => {
              const item = byId.get(id)
              return item ? <div key={id}>{renderItem(item, STATIC_DRAG_HANDLE, true)}</div> : null
            })}
          >
            <div className="cursor-grabbing">{renderItem(front, STATIC_DRAG_HANDLE, true)}</div>
          </StackedDragPreview>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
