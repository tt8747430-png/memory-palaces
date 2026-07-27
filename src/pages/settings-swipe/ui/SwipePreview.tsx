import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  useDroppable,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRight, Folder, Layers, WalletCards } from 'lucide-react'
import {
  SWIPE_ACTION_META,
  SWIPE_SIDE_MAX,
  type SwipeActionId,
  type SwipeConfig,
  type SwipeItemType,
} from '@/shared/config/swipe'
import { cn, useSortableSensors } from '@/shared/lib'
import { swipeActionIcon } from '@/shared/ui'
import { accentOf } from './swipe-accent'

const TYPE_ICON: Record<SwipeItemType, typeof Layers> = {
  deck: Layers,
  folder: Folder,
  card: WalletCards,
}

type CapSide = keyof SwipeConfig

const sideOf = (items: SwipeConfig, action: SwipeActionId): CapSide | null =>
  items.leading.includes(action) ? 'leading' : items.trailing.includes(action) ? 'trailing' : null

/** `over` is either a side container or a cap; resolve both to a side. */
const containerOf = (items: SwipeConfig, overId: string): CapSide | null =>
  overId === 'leading' || overId === 'trailing' ? overId : sideOf(items, overId as SwipeActionId)

export interface SwipePreviewProps {
  type: SwipeItemType
  config: SwipeConfig
  onChange: (next: SwipeConfig) => void
}

/**
 * Drag a cap to reorder within a side, or across the sample row to the other side. An action
 * lives on one side only, so its id is stable while it moves — which is what lets it hop
 * containers without the sortable flickering.
 */
export function SwipePreview({ type, config, onChange }: SwipePreviewProps) {
  const { t } = useTranslation()
  const TypeIcon = TYPE_ICON[type]
  const sensors = useSortableSensors()
  // Working copy: `onDragOver` relocates the cap live, so each side's sortable stays internally
  // consistent instead of fighting across contexts.
  const [items, setItems] = useState<SwipeConfig>(config)
  const [activeId, setActiveId] = useState<SwipeActionId | null>(null)
  useEffect(() => setItems(config), [config])

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const action = active.id as SwipeActionId
    const overId = String(over.id)
    setItems((prev) => {
      const from = sideOf(prev, action)
      const to = containerOf(prev, overId)
      if (!from || !to || from === to) return prev
      if (prev[to].includes(action)) return prev
      if (prev[to].length >= SWIPE_SIDE_MAX[to]) return prev
      const next = [...prev[to]]
      const at = overId === to ? next.length : next.indexOf(overId as SwipeActionId)
      next.splice(at < 0 ? next.length : at, 0, action)
      return { ...prev, [from]: prev[from].filter((x) => x !== action), [to]: next }
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) {
      setItems(config)
      return
    }
    const action = active.id as SwipeActionId
    const side = sideOf(items, action)
    const overId = String(over.id)
    let next = items
    if (side && overId !== 'leading' && overId !== 'trailing') {
      const list = items[side]
      const from = list.indexOf(action)
      const to = list.indexOf(overId as SwipeActionId)
      if (from >= 0 && to >= 0 && from !== to)
        next = { ...items, [side]: arrayMove(list, from, to) }
    }
    setItems(next)
    onChange(next)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragStart={(event: DragStartEvent) => setActiveId(event.active.id as SwipeActionId)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null)
        setItems(config)
      }}
    >
      <div className="flex items-center gap-1">
        <PreviewCaps side="leading" ids={items.leading} />
        <div
          aria-hidden
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-card bg-card px-3 py-2.5 shadow-rest"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-control bg-info-surface text-primary">
            <TypeIcon className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate text-(length:--p-text-body) font-semibold text-heading">
            {t(`swipe.sample.${type}` as never)}
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <PreviewCaps side="trailing" ids={items.trailing} />
      </div>

      {/* The dragged cap rides in an overlay, so the source keeps its slot instead of being
          flung across the screen by the drag transform. */}
      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {activeId ? <Cap action={activeId} floating /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function PreviewCaps({ side, ids }: { side: CapSide; ids: SwipeActionId[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: side })
  return (
    <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-9 shrink-0 items-center gap-1 rounded-2xl transition-colors',
          ids.length === 0 && 'w-9 justify-center',
          isOver && 'bg-primary/6',
        )}
      >
        {ids.length === 0 ? (
          <span
            aria-hidden
            className="size-8 rounded-[13px] border-2 border-dashed border-border"
          />
        ) : (
          ids.map((id) => <SortableCap key={id} action={id} />)
        )}
      </div>
    </SortableContext>
  )
}

function SortableCap({ action }: { action: SwipeActionId }) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: action,
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-label={t('swipe.reorderLabel', { name: t(SWIPE_ACTION_META[action].labelKey as never) })}
      style={{ transform: CSS.Transform.toString(transform), transition, touchAction: 'none' }}
      className={cn(
        'shrink-0 cursor-grab rounded-[14px] active:cursor-grabbing',
        // The overlay stands in for it while dragging.
        isDragging && 'opacity-0',
      )}
    >
      <Cap action={action} />
    </button>
  )
}

function Cap({ action, floating = false }: { action: SwipeActionId; floating?: boolean }) {
  const accent = accentOf(action)
  return (
    <span
      style={{ backgroundColor: accent.fill }}
      className={cn(
        'grid size-9 place-items-center rounded-[14px] [&_svg]:size-4',
        floating && 'scale-105 shadow-elevated',
        accent.ink === 'dark' ? 'text-(--p-navy-900)' : 'text-white',
      )}
    >
      {swipeActionIcon(action)}
    </span>
  )
}
