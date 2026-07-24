import { type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, useSortableSensors } from '@/shared/lib'
import { StackedDragPreview } from '@/shared/ui'
import type { RowDragHandle } from './ContentRows'

const STATIC_DRAG_HANDLE: RowDragHandle = { ref: () => {}, props: {} }
const NO_CARRIED: ReadonlySet<string> = new Set()

function SortableContentRow({
  id,
  carried,
  children,
}: {
  id: string
  /** True while this row travels with a multi-select drag — dimmed in place. */
  carried: boolean
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
      className={cn(isDragging && 'relative z-10', (isDragging || carried) && 'opacity-40')}
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
  selectedIds,
}: {
  items: T[]
  reorderable: boolean
  onReorder: (orderedIds: string[]) => void
  renderItem: (item: T, dragHandle?: RowDragHandle, dragging?: boolean) => ReactNode
  /** When set, dragging a selected row moves the whole selected block together. */
  selectedIds?: ReadonlySet<string>
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [ordered, setOrdered] = useState(items)
  useEffect(() => setOrdered(items), [items])
  const sensors = useSortableSensors()

  // The block a drag carries: the whole selection when the grabbed row is part of a multi-
  // selection, otherwise just the grabbed row. Kept in list order so it lands contiguously.
  const carriedIds = useMemo<ReadonlySet<string>>(() => {
    if (!activeId) return NO_CARRIED
    if (selectedIds && selectedIds.has(activeId) && selectedIds.size > 1) {
      return new Set(ordered.map((item) => item.id).filter((id) => selectedIds.has(id)))
    }
    return new Set([activeId])
  }, [activeId, selectedIds, ordered])

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
        const { over } = event
        if (!over) return
        const overId = String(over.id)
        if (carriedIds.has(overId)) return

        const fullOrder = ordered.map((item) => item.id)
        const carried = fullOrder.filter((id) => carriedIds.has(id))
        if (carried.length === 0) return

        // Land the block after the target when dragging down, before it when dragging up —
        // the same rule dnd-kit's single-item move follows, generalized to a block.
        const overIndex = fullOrder.indexOf(overId)
        const firstCarried = fullOrder.findIndex((id) => carriedIds.has(id))
        const rest = fullOrder.filter((id) => !carriedIds.has(id))
        const at = rest.indexOf(overId) + (overIndex > firstCarried ? 1 : 0)
        const nextIds = [...rest.slice(0, at), ...carried, ...rest.slice(at)]

        const byId = new Map(ordered.map((item) => [item.id, item]))
        setOrdered(nextIds.map((id) => byId.get(id)!).filter(Boolean) as T[])
        onReorder(nextIds)
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext
        items={ordered.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {ordered.map((item) => (
            <SortableContentRow key={item.id} id={item.id} carried={carriedIds.has(item.id)}>
              {(handle) => renderItem(item, handle)}
            </SortableContentRow>
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {active ? (
          <StackedDragPreview count={carriedIds.size}>
            <div className="origin-center cursor-grabbing motion-safe:scale-[1.03]">
              {renderItem(active, STATIC_DRAG_HANDLE, true)}
            </div>
          </StackedDragPreview>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
