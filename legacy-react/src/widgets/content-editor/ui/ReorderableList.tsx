import { type ReactNode, useEffect, useState } from 'react'
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

const STATIC_DRAG_HANDLE: RowDragHandle = { ref: () => {}, props: {} }

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
  const [ordered, setOrdered] = useState(items)
  useEffect(() => setOrdered(items), [items])
  const sensors = useSortableSensors()

  if (!reorderable) return <>{items.map((item) => renderItem(item))}</>

  const active = activeId ? ordered.find((item) => item.id === activeId) : undefined

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
        const fromIndex = ordered.findIndex((item) => item.id === from.id)
        const toIndex = ordered.findIndex((item) => item.id === over.id)
        if (fromIndex < 0 || toIndex < 0) return
        const next = arrayMove(ordered, fromIndex, toIndex)
        setOrdered(next)
        onReorder(next.map((item) => item.id))
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext
        items={ordered.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {ordered.map((item) => (
            <SortableContentRow key={item.id} id={item.id}>
              {(handle) => renderItem(item, handle)}
            </SortableContentRow>
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {active ? (
          <div className="origin-center cursor-grabbing motion-safe:scale-[1.03]">
            {renderItem(active, STATIC_DRAG_HANDLE, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
