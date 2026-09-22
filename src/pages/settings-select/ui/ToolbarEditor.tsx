import { useEffect, useState } from 'react'
import { ACTION_META } from '@/shared/config/actions'
import { useTranslation } from 'react-i18next'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import { arrayMove, horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { type SelectActionId, type SelectToolbarConfig } from '@/shared/config/select-toolbar'
import { cn, EASE_OUT_CSS, useSortableSensors } from '@/shared/lib'
import {
  cardSurface,
  CloseBadge,
  DockPill,
  SelectToolbarRow,
  SelectToolbarSlot,
  SortableRow,
} from '@/shared/ui'

export interface ToolbarEditorProps {
  actions: SelectToolbarConfig
  canRemove: boolean
  onReorder: (next: SelectToolbarConfig) => void
  onRemove: (id: SelectActionId) => void
}

export function ToolbarEditor({ actions, canRemove, onReorder, onRemove }: ToolbarEditorProps) {
  const { t } = useTranslation()
  const sensors = useSortableSensors()
  const [activeId, setActiveId] = useState<SelectActionId | null>(null)

  const [items, setItems] = useState<SelectToolbarConfig>(actions)
  useEffect(() => setItems(actions), [actions])

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const from = items.indexOf(active.id as SelectActionId)
    const to = items.indexOf(over.id as SelectActionId)
    if (from < 0 || to < 0) return
    const next = arrayMove(items, from, to)
    setItems(next)
    onReorder(next)
  }

  return (
    <div className={cn(cardSurface, 'p-3.5')}>
      <span className="text-label font-bold text-heading">{t('select.inBar')}</span>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as SelectActionId)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={items} strategy={horizontalListSortingStrategy}>
          {/* The bar itself — the dock's pill at the dock's size — so what is arranged here is
              what appears at the bottom of the screen, tile for tile. */}
          <div className="mx-auto mt-4 h-16 w-64">
            <DockPill>
              <SelectToolbarRow>
                {items.map((id) => (
                  <SortableTile key={id} action={id} canRemove={canRemove} onRemove={onRemove} />
                ))}
              </SelectToolbarRow>
            </DockPill>
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={{ duration: 200, easing: EASE_OUT_CSS }}>
          {activeId ? (
            <div className="relative h-16 w-full">
              <SelectToolbarSlot
                action={activeId}
                inert
                className="rounded-control bg-(--nav-pill)"
              />
              {canRemove ? <CloseBadge /> : null}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function SortableTile({
  action,
  canRemove,
  onRemove,
}: {
  action: SelectActionId
  canRemove: boolean
  onRemove: (id: SelectActionId) => void
}) {
  const { t } = useTranslation()
  const label = t(ACTION_META[action].labelKey as never)

  return (
    <SortableRow id={action} className="relative h-full min-w-0 flex-1">
      {({ handleRef, handleProps, isDragging }) => (
        <div className={cn('relative h-full', isDragging && 'opacity-0')}>
          <button
            type="button"
            ref={handleRef}
            {...handleProps}
            aria-label={t('select.reorderLabel', { name: label })}
            className="h-full w-full cursor-grab touch-none rounded-control active:cursor-grabbing"
          >
            <SelectToolbarSlot action={action} inert />
          </button>

          {canRemove ? (
            <CloseBadge
              label={t('select.removeLabel', { name: label })}
              onClick={() => onRemove(action)}
            />
          ) : null}
        </div>
      )}
    </SortableRow>
  )
}
