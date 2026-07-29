import { useEffect, useState } from 'react'
import { ACTION_META } from '@/shared/config/actions'
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
import { arrayMove, horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { ChevronRight, Folder, Layers, WalletCards } from 'lucide-react'
import {
  SWIPE_SIDE_MAX,
  type SwipeActionId,
  type SwipeConfig,
  type SwipeItemType,
} from '@/shared/config/swipe'
import { cn, EASE_OUT_CSS, useSortableSensors } from '@/shared/lib'
import { SortableRow, swipeActionIcon } from '@/shared/ui'
import { accentOf } from './swipe-accent'

const TYPE_ICON: Record<SwipeItemType, typeof Layers> = {
  deck: Layers,
  folder: Folder,
  card: WalletCards,
}

type CapSide = keyof SwipeConfig

const sideOf = (items: SwipeConfig, action: SwipeActionId): CapSide | null =>
  items.leading.includes(action) ? 'leading' : items.trailing.includes(action) ? 'trailing' : null

const containerOf = (items: SwipeConfig, overId: string): CapSide | null =>
  overId === 'leading' || overId === 'trailing' ? overId : sideOf(items, overId as SwipeActionId)

export interface SwipePreviewProps {
  type: SwipeItemType
  config: SwipeConfig
  onChange: (next: SwipeConfig) => void
}

export function SwipePreview({ type, config, onChange }: SwipePreviewProps) {
  const { t } = useTranslation()
  const TypeIcon = TYPE_ICON[type]
  const sensors = useSortableSensors()
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

      <DragOverlay dropAnimation={{ duration: 200, easing: EASE_OUT_CSS }}>
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
  return (
    <SortableRow id={action} className="shrink-0">
      {({ handleRef, handleProps, isDragging }) => (
        <button
          ref={handleRef}
          type="button"
          {...handleProps}
          aria-label={t('swipe.reorderLabel', { name: t(ACTION_META[action].labelKey as never) })}
          className={cn(
            'shrink-0 cursor-grab touch-none rounded-[14px] active:cursor-grabbing',
            isDragging && 'opacity-0',
          )}
        >
          <Cap action={action} />
        </button>
      )}
    </SortableRow>
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
