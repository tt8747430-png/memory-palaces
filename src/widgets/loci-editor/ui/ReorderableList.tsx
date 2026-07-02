import { type ReactNode, useState } from 'react'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, useSortableSensors } from '@/shared/lib'
import type { RowDragHandle } from './ContentRows'

/** A non-interactive grip binding for the lifted overlay clone: it renders the same grip and
 * select chrome as the row it stands in for (dnd-kit owns the real drag on the source), so the
 * card in hand reads as the whole row rising — not a stripped-down duplicate. */
const STATIC_DRAG_HANDLE: RowDragHandle = { ref: () => {}, props: {} }

/** Wraps a row as a dnd-kit sortable: the wrapper carries the transform/transition and
 * ghosts the source while its overlay clone is in hand; the row gets the grip's activator
 * wiring through the render prop. */
function SortableContentRow({
  id,
  children,
}: {
  id: string
  children: (handle: RowDragHandle) => ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'relative z-10 opacity-40')}
    >
      {children({ ref: setActivatorNodeRef, props: { ...attributes, ...listeners } })}
    </div>
  )
}

/** Renders a list of rows, drag-reorderable when `reorderable`. Off, it's a plain map; on,
 * it lifts a clone into a {@link DragOverlay} and commits the new id order on drop. Shared by
 * the cards editor and the questions manager. */
export function ReorderableList<T extends { id: string }>({
  items,
  reorderable,
  onReorder,
  renderItem,
}: {
  items: T[]
  reorderable: boolean
  onReorder: (orderedIds: string[]) => void
  renderItem: (item: T, dragHandle?: RowDragHandle, dragging?: boolean) => ReactNode
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSortableSensors()

  if (!reorderable) return <>{items.map((item) => renderItem(item))}</>

  const active = activeId ? items.find((item) => item.id === activeId) : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
      onDragEnd={(event: DragEndEvent) => {
        setActiveId(null)
        const { active: from, over } = event
        if (!over || from.id === over.id) return
        const fromIndex = items.findIndex((item) => item.id === from.id)
        const toIndex = items.findIndex((item) => item.id === over.id)
        if (fromIndex < 0 || toIndex < 0) return
        onReorder(arrayMove(items, fromIndex, toIndex).map((item) => item.id))
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <SortableContentRow key={item.id} id={item.id}>
              {(handle) => renderItem(item, handle)}
            </SortableContentRow>
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {active ? (
          // Lift the clone off the list: it keeps the row's own grip + select chrome (via the
          // static handle) and the elevated shadow, plus a small level scale so the whole row
          // clearly reads as "in hand" (no tilt, no scale under reduced motion).
          <div className="origin-center cursor-grabbing motion-safe:scale-[1.03]">
            {renderItem(active, STATIC_DRAG_HANDLE, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
