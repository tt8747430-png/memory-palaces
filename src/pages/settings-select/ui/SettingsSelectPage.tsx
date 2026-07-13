import { type CSSProperties, useEffect, useState } from 'react'
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
import { CheckSquare, Layers, ListChecks, Plus, RotateCcw, WalletCards, X } from 'lucide-react'
import {
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'
import { SWIPE_ACCENT } from '@/shared/config/swipe'
import {
  DEFAULT_SELECT_TOOLBAR,
  normalizeSelectToolbar,
  SELECT_ACTION_META,
  SELECT_ACTIONS,
  SELECT_SURFACES,
  SELECT_TOOLBAR_MAX,
  type SelectActionId,
  type SelectSurface,
  type SelectToolbarConfig,
} from '@/shared/config/select-toolbar'
import { cn, useSortableSensors } from '@/shared/lib'
import {
  AppScreen,
  Button,
  cardSurface,
  ScreenHeader,
  SegmentedControl,
  selectActionIcon,
} from '@/shared/ui'

const SURFACE_ICON: Record<SelectSurface, typeof Layers> = {
  library: Layers,
  card: WalletCards,
  question: ListChecks,
}

const accentOf = (id: SelectActionId) => SWIPE_ACCENT[SELECT_ACTION_META[id].accent]

export interface SettingsSelectPageProps {
  onBack?: () => void
}

export function SettingsSelectPage({ onBack }: SettingsSelectPageProps) {
  const { t } = useTranslation()
  const store = usePreferencesStoreApi()
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const [surface, setSurface] = useState<SelectSurface>('library')

  useEffect(() => {
    store.getState().start()
  }, [store])

  const config = prefs.selectToolbar[surface]
  const palette = SELECT_ACTIONS[surface].filter((id) => !config.includes(id))
  const full = config.length >= SELECT_TOOLBAR_MAX

  const save = (next: SelectToolbarConfig) =>
    void setPreferences(store, {
      selectToolbar: {
        ...prefs.selectToolbar,
        [surface]: normalizeSelectToolbar(surface, next),
      },
    })

  const add = (id: SelectActionId) => {
    if (full) return
    save([...config, id])
  }
  // The bar always keeps one action — an empty toolbar would strand a selection.
  const remove = (id: SelectActionId) => {
    if (config.length <= 1) return
    save(config.filter((x) => x !== id))
  }
  // The preview above snaps back to the defaults, so the reset speaks for itself.
  const resetAll = () => void setPreferences(store, { selectToolbar: DEFAULT_SELECT_TOOLBAR })

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader title={t('select.title')} onBack={onBack} backLabel={t('settings.back')} />
      }
    >
      <div className="mt-3 flex flex-col gap-4 pb-24">
        <p className="flex items-start gap-2 px-1 text-[length:var(--p-text-label)] leading-relaxed text-muted-foreground">
          <CheckSquare className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {t('select.subtitle')}
        </p>

        <SegmentedControl
          aria-label={t('select.title')}
          value={surface}
          onChange={setSurface}
          size="sm"
          options={SELECT_SURFACES.map((value) => {
            const Icon = SURFACE_ICON[value]
            return {
              value,
              ariaLabel: t(`select.surfaces.${value}` as never),
              label: (
                <span className="flex items-center gap-1.5">
                  <Icon className="size-4" aria-hidden />
                  {t(`select.surfaces.${value}` as never)}
                </span>
              ),
            }
          })}
        />

        {/* The preview is the editor: this is the bar as it will appear, and it
            is where actions are reordered and removed. */}
        <ToolbarEditor
          actions={config}
          canRemove={config.length > 1}
          onReorder={save}
          onRemove={remove}
        />

        <section className={cn(cardSurface, 'p-3.5')}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[length:var(--p-text-label)] font-bold text-heading">
              {t('select.available')}
            </span>
            <span
              className={cn(
                'rounded-pill px-2 py-0.5 text-[length:var(--p-text-tiny)] font-bold tabular-nums',
                full
                  ? 'bg-info-surface text-info-foreground'
                  : 'bg-secondary/50 text-muted-foreground',
              )}
            >
              {t('select.slots', { count: config.length, max: SELECT_TOOLBAR_MAX })}
            </span>
          </div>

          {palette.length === 0 ? (
            <p className="mt-2.5 text-[length:var(--p-text-label)] text-muted-foreground">
              {t('select.allInUse')}
            </p>
          ) : (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {palette.map((id) => {
                const accent = accentOf(id)
                const label = t(SELECT_ACTION_META[id].labelKey as never)
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={full}
                    onClick={() => add(id)}
                    aria-label={t('select.addLabel', { name: label })}
                    style={{ '--sw': accent.fill } as CSSProperties}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-[length:var(--p-text-label)] font-semibold',
                      'sw-tint transition-[transform,opacity] active:scale-[0.96]',
                      'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30',
                      full && 'opacity-40',
                    )}
                  >
                    <span className="grid size-4 place-items-center [&_svg]:size-3.5">
                      {selectActionIcon(id)}
                    </span>
                    {label}
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                )
              })}
            </div>
          )}

          {full ? (
            <p className="mt-2.5 text-[length:var(--p-text-tiny)] text-muted-foreground">
              {t('select.full')}
            </p>
          ) : null}
        </section>

        <Button variant="ghost" onClick={resetAll} className="self-start">
          <RotateCcw className="size-[18px]" aria-hidden />
          {t('select.reset')}
        </Button>
      </div>
    </AppScreen>
  )
}

/**
 * The bar, live. Tiles drag to reorder and carry a remove badge; what you see
 * here is exactly what a selection will meet — same tiles, same order.
 */
function ToolbarEditor({
  actions,
  canRemove,
  onReorder,
  onRemove,
}: {
  actions: SelectToolbarConfig
  canRemove: boolean
  onReorder: (next: SelectToolbarConfig) => void
  onRemove: (id: SelectActionId) => void
}) {
  const { t } = useTranslation()
  const sensors = useSortableSensors()
  const [activeId, setActiveId] = useState<SelectActionId | null>(null)

  // Working copy. The saved bar takes a round-trip through the database before
  // it comes back, and rendering the *old* order in that gap is what makes a
  // dropped tile snap back to where it came from and then jump — the drop has to
  // be true on screen the instant the finger lifts.
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
      <span className="text-[length:var(--p-text-label)] font-bold text-heading">
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

/** One toolbar tile — the same shape `SelectToolbar` renders in the bar. */
function Tile({ action, floating = false }: { action: SelectActionId; floating?: boolean }) {
  const { t } = useTranslation()
  const meta = SELECT_ACTION_META[action]

  return (
    <span
      className={cn(
        'flex size-full min-w-0 flex-col items-center justify-center gap-1 rounded-control px-1 py-2',
        meta.destructive
          ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]'
          : 'bg-info-surface text-heading',
        // The tile in hand keeps the footprint of the tile it came out of — a
        // different size here would morph on the way down, which reads as a
        // flicker. Elevation carries the lift instead.
        floating && 'shadow-elevated ring-1 ring-accent/40',
      )}
    >
      <span className="[&_svg]:size-[18px]">{selectActionIcon(action)}</span>
      <span className="w-full truncate text-center text-[length:var(--p-text-tiny)] font-semibold">
        {t(meta.labelKey as never)}
      </span>
    </span>
  )
}
