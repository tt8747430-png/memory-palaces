import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
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
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ChevronRight,
  Folder,
  Layers,
  RotateCcw,
  WalletCards,
} from 'lucide-react'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'
import {
  DEFAULT_SWIPE,
  normalizeSwipeConfig,
  SWIPE_ACCENT,
  SWIPE_ACTION_META,
  SWIPE_ACTIONS,
  SWIPE_ITEM_TYPES,
  SWIPE_SIDE_MAX,
  type SwipeActionId,
  type SwipeConfig,
  type SwipeItemType,
} from '@/shared/config/swipe'
import {
  AppScreen,
  Button,
  cardSurface,
  ScreenHeader,
  SegmentedControl,
  swipeActionIcon,
} from '@/shared/ui'
import { cn, useSortableSensors } from '@/shared/lib'

const TYPE_ICON: Record<SwipeItemType, typeof Layers> = {
  deck: Layers,
  folder: Folder,
  card: WalletCards,
}

/** Resolved accent for a swipe action — the shared source of truth for its
 *  solid fill (preview caps) and its tinted chip (`--sw` custom property). */
function accentOf(id: SwipeActionId) {
  return SWIPE_ACCENT[SWIPE_ACTION_META[id].accent]
}

export interface SettingsSwipePageProps {
  onBack?: () => void
}

export function SettingsSwipePage({ onBack }: SettingsSwipePageProps) {
  const { t } = useTranslation()
  const store = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const [type, setType] = useState<SwipeItemType>('deck')

  useEffect(() => {
    store.getState().start()
  }, [store])

  const save = (next: SwipeConfig) =>
    void setPreferences(store, {
      swipe: { ...prefs.swipe, [type]: normalizeSwipeConfig(type, next) },
    })

  const toggle = (side: keyof SwipeConfig, id: SwipeActionId) => {
    const current = prefs.swipe[type]
    if (current[side].includes(id)) {
      save({ ...current, [side]: current[side].filter((x) => x !== id) })
      return
    }
    // An action lives on one side only, so picking it here takes it off the other.
    const other: keyof SwipeConfig = side === 'leading' ? 'trailing' : 'leading'
    save({
      ...current,
      [side]: [...current[side], id],
      [other]: current[other].filter((x) => x !== id),
    })
  }

  const resetAll = () => void setPreferences(store, { swipe: DEFAULT_SWIPE })

  const config = prefs.swipe[type]

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader title={t('swipe.title')} onBack={onBack} backLabel={t('settings.back')} />
      }
    >
      <div className="mt-3 flex flex-col gap-4 pb-24">
        <p className="flex items-start gap-2 px-1 text-[length:var(--p-text-label)] leading-relaxed text-muted-foreground">
          <ArrowLeftRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {t('swipe.subtitle')}
        </p>

        <SegmentedControl
          aria-label={t('swipe.title')}
          value={type}
          onChange={setType}
          size="sm"
          options={SWIPE_ITEM_TYPES.map((value) => {
            const Icon = TYPE_ICON[value]
            return {
              value,
              ariaLabel: t(`swipe.types.${value}` as never),
              label: (
                <span className="flex items-center gap-1.5">
                  <Icon className="size-4" aria-hidden />
                  {t(`swipe.types.${value}` as never)}
                </span>
              ),
            }
          })}
        />

        <SwipePreview type={type} config={config} onChange={save} />

        <section className={cn(cardSurface, 'divide-y divide-border/60 p-0')}>
          <SideGroup
            icon={<ArrowRight className="size-3.5" aria-hidden />}
            label={t('swipe.leading')}
            side="leading"
            type={type}
            selected={config.leading}
            onToggle={(id) => toggle('leading', id)}
          />
          <SideGroup
            icon={<ArrowLeft className="size-3.5" aria-hidden />}
            label={t('swipe.trailing')}
            side="trailing"
            type={type}
            selected={config.trailing}
            onToggle={(id) => toggle('trailing', id)}
          />
        </section>

        <Button variant="ghost" onClick={resetAll} className="self-start">
          <RotateCcw className="size-[18px]" aria-hidden />
          {t('swipe.reset')}
        </Button>
      </div>
    </AppScreen>
  )
}

type CapSide = keyof SwipeConfig

const sideOf = (items: SwipeConfig, action: SwipeActionId): CapSide | null =>
  items.leading.includes(action) ? 'leading' : items.trailing.includes(action) ? 'trailing' : null

/** `over` is either a side container or a cap; resolve both to a side. */
const containerOf = (items: SwipeConfig, overId: string): CapSide | null =>
  overId === 'leading' || overId === 'trailing' ? overId : sideOf(items, overId as SwipeActionId)

/** Drag a cap to reorder within a side, or across the sample row to the other
 *  side. An action lives on one side only, so its id is stable while it moves —
 *  which is what lets it hop containers without the sortable flickering. */
function SwipePreview({
  type,
  config,
  onChange,
}: {
  type: SwipeItemType
  config: SwipeConfig
  onChange: (next: SwipeConfig) => void
}) {
  const { t } = useTranslation()
  const TypeIcon = TYPE_ICON[type]
  const sensors = useSortableSensors()
  // Working copy: `onDragOver` relocates the cap live, so each side's sortable
  // stays internally consistent instead of fighting across contexts.
  const [items, setItems] = useState<SwipeConfig>(config)
  const [activeId, setActiveId] = useState<SwipeActionId | null>(null)
  useEffect(() => setItems(config), [config])

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as SwipeActionId)

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
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

  const handleDragCancel = () => {
    setActiveId(null)
    setItems(config)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
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
          <span className="min-w-0 flex-1 truncate text-[length:var(--p-text-body)] font-semibold text-heading">
            {t(`swipe.sample.${type}` as never)}
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <PreviewCaps side="trailing" ids={items.trailing} />
      </div>

      {/* The dragged cap rides in an overlay, so the source keeps its slot
          instead of being flung across the screen by the drag transform. */}
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

function SideGroup({
  icon,
  label,
  side,
  type,
  selected,
  onToggle,
}: {
  icon: ReactNode
  label: string
  side: keyof SwipeConfig
  type: SwipeItemType
  selected: SwipeActionId[]
  onToggle: (id: SwipeActionId) => void
}) {
  const { t } = useTranslation()
  const max = SWIPE_SIDE_MAX[side]
  const atCap = selected.length >= max

  return (
    <div className="p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[length:var(--p-text-label)] font-bold text-heading">
          <span className="grid size-5 place-items-center rounded-md bg-primary/[0.07] text-primary">
            {icon}
          </span>
          {label}
        </span>
        <span
          className={cn(
            'rounded-pill px-2 py-0.5 text-[length:var(--p-text-tiny)] font-bold tabular-nums',
            atCap
              ? 'bg-info-surface text-info-foreground'
              : 'bg-secondary/50 text-muted-foreground',
          )}
        >
          {t('swipe.sideCount', { count: selected.length, max })}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {SWIPE_ACTIONS[type].map((id) => {
          const on = selected.includes(id)
          const accent = accentOf(id)
          const disabled = !on && atCap
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onToggle(id)}
              style={on ? ({ '--sw': accent.fill } as CSSProperties) : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-[length:var(--p-text-label)] font-semibold transition-[transform,background-color,color] active:scale-[0.96]',
                'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30',
                on ? 'sw-tint' : 'bg-secondary/40 text-muted-foreground',
                disabled && 'opacity-40',
              )}
              data-swipe-side={side}
            >
              <span className="grid size-4 place-items-center [&_svg]:size-3.5">
                {swipeActionIcon(id)}
              </span>
              {t(SWIPE_ACTION_META[id].labelKey as never)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
