import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X } from 'lucide-react'
import {
  SELECT_ACTION_META,
  type SelectActionId,
  type SelectToolbarConfig,
} from '@/shared/config/select-toolbar'
import { cn, useSortableSensors } from '@/shared/lib'
import { cardSurface, selectActionIcon } from '@/shared/ui'

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
      <span className="text-(length:--p-text-label) font-bold text-heading">
        {t('select.inBar')}
      </span>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as SelectActionId)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={items} strategy={horizontalListSortingStrategy}>
          <div className="mt-2.5 flex items-stretch gap-1.5 rounded-card-featured bg-card/95 p-2 shadow-elevated">
            {items.map((id) => (
              <SortableTile key={id} action={id} canRemove={canRemove} onRemove={onRemove} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
          {activeId ? <Tile action={activeId} floating /> : null}
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: action,
  })
  const label = t(SELECT_ACTION_META[action].labelKey as never)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, touchAction: 'none' }}
      className={cn('relative min-w-0 flex-1', isDragging && 'opacity-0')}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t('select.reorderLabel', { name: label })}
        className="w-full cursor-grab active:cursor-grabbing"
      >
        <Tile action={action} />
      </button>

      {canRemove ? (
        <button
          type="button"
          onClick={() => onRemove(action)}
          aria-label={t('select.removeLabel', { name: label })}
          className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-heading text-[color:var(--surface)] shadow-rest transition-transform active:scale-90"
        >
          <X className="size-3" strokeWidth={3} aria-hidden />
        </button>
      ) : null}
    </div>
  )
}

function Tile({ action, floating = false }: { action: SelectActionId; floating?: boolean }) {
  const { t } = useTranslation()
  const meta = SELECT_ACTION_META[action]

  return (
    <span
      className={cn(
        'flex size-full min-w-0 flex-col items-center justify-center gap-1 rounded-control px-1 py-2',
        meta.destructive
          ? 'bg-(--danger-surface) text-(--danger-on-surface)'
          : 'bg-info-surface text-heading',
        floating && 'shadow-elevated ring-1 ring-accent/40',
      )}
    >
      <span className="[&_svg]:size-[18px]">{selectActionIcon(action)}</span>
      <span className="w-full truncate text-center text-(length:--p-text-tiny) font-semibold">
        {t(meta.labelKey as never)}
      </span>
    </span>
  )
}
