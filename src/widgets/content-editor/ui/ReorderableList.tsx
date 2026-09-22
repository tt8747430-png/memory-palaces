import { type ReactNode, useCallback, useMemo } from 'react'
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn, useHeldOrder, useSortableBlock, useSortableSensors } from '@/shared/lib'
import { SortableRow, StackedDragPreview } from '@/shared/ui'
import type { RowDragHandle } from './ContentRow'

const STATIC_DRAG_HANDLE: RowDragHandle = { ref: () => {}, props: {} }

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
  selectedIds?: ReadonlySet<string>
}) {
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const itemIds = useMemo(() => items.map((item) => item.id), [items])
  const { order: orderedIds, hold } = useHeldOrder(itemIds)
  const ordered = useMemo(() => orderedIds.flatMap((id) => byId.get(id) ?? []), [orderedIds, byId])

  const sensors = useSortableSensors()
  const sectionOf = useCallback(() => orderedIds, [orderedIds])
  const drag = useSortableBlock({ sectionOf, selectedIds })
  const front = drag.stackIds[0] ? byId.get(drag.stackIds[0]) : undefined

  const visible = useMemo(() => ordered.filter((item) => !drag.isHidden(item.id)), [ordered, drag])

  if (!reorderable) return <>{items.map((item) => renderItem(item))}</>

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
      <SortableContext
        items={visible.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {visible.map((item) => (
            <SortableRow key={item.id} id={item.id} landingRef={drag.landingRef(item.id)}>
              {({ frameRef, handleRef, handleProps, isDragging }) => (
                <div ref={frameRef} className={cn(isDragging && 'opacity-0')}>
                  {renderItem(item, { ref: handleRef, props: handleProps })}
                </div>
              )}
            </SortableRow>
          ))}
        </div>
      </SortableContext>

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
