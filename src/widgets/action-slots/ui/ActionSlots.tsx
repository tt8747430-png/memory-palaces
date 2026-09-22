import { type CSSProperties, type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import { arrayMove, horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { accentStyleOf, ACTION_META, type ActionId } from '@/shared/config/actions'
import { cn, EASE_OUT_CSS, useHeldOrder, useSortableSensors } from '@/shared/lib'
import {
  actionIcon,
  ActionSheet,
  CLOSE_BADGE_ROW_GAP,
  CloseBadge,
  SlotCount,
  SortableRow,
} from '@/shared/ui'

/** A slot's footprint: the tile, its name beneath, and the room the badge and the ring need. */
const SLOT_BOX = 'flex min-w-0 flex-1 basis-0 max-w-18 flex-col items-center gap-1'

export interface ActionSlotsProps<T extends ActionId> {
  /** What the strip holds, in the order it holds them. */
  ids: readonly T[]
  /** How many slots the strip has. */
  max: number
  /** What the picker offers — the ids this strip could still take, decided by the screen. */
  options: readonly T[]
  /** Names the strip, and titles the sheet its `+` opens. */
  label: string
  /** Drawn before the name: which swipe this is, which bar. */
  icon?: ReactNode
  /** The strip may not go below this many — the select toolbar keeps one. */
  min?: number
  onReorder: (ids: T[]) => void
  onAdd: (id: T) => void
  onRemove: (id: T) => void
}

/**
 * A strip of action slots, and the whole of how a learner arranges one: a filled slot wears its
 * action's own colour and name, drags to a new place and carries a badge that takes it off; an
 * empty slot is a `+` that opens the actions still on offer. The strip a learner arranges is drawn
 * the same way as the rail it becomes, so nothing is arranged in the abstract.
 *
 * It replaced a mode: the two screens used to set an invisible "add to" target and then read a tap
 * on a palette pill against it, so the same tap meant different things with nothing on screen
 * saying which. Here the subject of every gesture is the slot under the thumb.
 */
export function ActionSlots<T extends ActionId>({
  ids,
  max,
  options,
  label,
  icon,
  min = 0,
  onReorder,
  onAdd,
  onRemove,
}: ActionSlotsProps<T>) {
  const { t } = useTranslation()
  const sensors = useSortableSensors()
  const [activeId, setActiveId] = useState<T | null>(null)
  const [picking, setPicking] = useState(false)

  // A dropped order is held on screen until the preference store says the same, or the slots snap
  // back under the finger for a frame (CODE_STYLE §10, cause 1).
  const { order: items, hold } = useHeldOrder(ids)

  const full = items.length >= max
  const canRemove = items.length > min
  const empties = Math.max(0, max - items.length)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const from = items.indexOf(active.id as T)
    const to = items.indexOf(over.id as T)
    if (from < 0 || to < 0) return
    const next = arrayMove([...items], from, to)
    hold(next)
    onReorder(next)
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="flex min-w-0 items-center gap-1.5 text-label font-bold text-heading">
          {icon ? (
            <span aria-hidden className="text-primary [&_svg]:size-4">
              {icon}
            </span>
          ) : null}
          <span className="truncate">{label}</span>
        </span>
        <SlotCount full={full}>{t('slots.count', { count: items.length, max })}</SlotCount>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragStart={(event: DragStartEvent) => setActiveId(event.active.id as T)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={[...items]} strategy={horizontalListSortingStrategy}>
          {/* The gap is the close badge's overhang and the focus ring, not decoration (§5). */}
          <ul className={cn('flex list-none items-start', CLOSE_BADGE_ROW_GAP)}>
            {items.map((id) => (
              <SortableSlot key={id} action={id} canRemove={canRemove} onRemove={onRemove} />
            ))}
            {Array.from({ length: empties }, (_, at) => (
              <li key={`empty-${at}`} className={SLOT_BOX}>
                {at === 0 ? (
                  <button
                    type="button"
                    onClick={() => setPicking(true)}
                    aria-label={t('slots.add', { strip: label })}
                    className={cn(
                      'grid size-9 place-items-center rounded-tile-slot border-2 border-dashed border-border text-muted-foreground',
                      'transition-[transform,border-color,color] active:scale-[0.94] hover:border-primary/40 hover:text-primary',
                      'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
                    )}
                  >
                    <Plus className="size-4" aria-hidden />
                  </button>
                ) : (
                  <span
                    aria-hidden
                    className="size-9 rounded-tile-slot border-2 border-dashed border-border/60"
                  />
                )}
              </li>
            ))}
          </ul>
        </SortableContext>

        <DragOverlay dropAnimation={{ duration: 200, easing: EASE_OUT_CSS }}>
          {activeId ? (
            <span className="relative block">
              <SlotFace action={activeId} floating />
              {canRemove ? <CloseBadge /> : null}
            </span>
          ) : null}
        </DragOverlay>
      </DndContext>

      {items.length === 0 ? (
        <p className="px-1 text-tiny leading-snug text-muted-foreground">{t('slots.empty')}</p>
      ) : null}

      <ActionSheet
        open={picking}
        onOpenChange={setPicking}
        title={t('slots.pick', { strip: label })}
        description={options.length === 0 ? t('slots.allInUse') : undefined}
        actions={options.map((id) => ({
          id,
          label: t(ACTION_META[id].labelKey as never),
          icon: <SlotFace action={id} />,
          onSelect: () => onAdd(id),
        }))}
        cancelLabel={t('common.cancel')}
      />
    </section>
  )
}

function SortableSlot<T extends ActionId>({
  action,
  canRemove,
  onRemove,
}: {
  action: T
  canRemove: boolean
  onRemove: (id: T) => void
}) {
  const { t } = useTranslation()
  const name = t(ACTION_META[action].labelKey as never)
  return (
    <SortableRow id={action} as="li" className={SLOT_BOX}>
      {({ handleRef, handleProps, isDragging }) => (
        <span className={cn('relative block', isDragging && 'opacity-0')}>
          <button
            ref={handleRef}
            type="button"
            {...handleProps}
            aria-label={t('slots.reorder', { name })}
            className={cn(
              'flex cursor-grab touch-none flex-col items-center gap-1 rounded-tile active:cursor-grabbing',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
            )}
          >
            <SlotFace action={action} />
            <span className="w-full truncate text-center text-tiny font-semibold text-muted-foreground">
              {name}
            </span>
          </button>
          {canRemove ? (
            <CloseBadge label={t('slots.remove', { name })} onClick={() => onRemove(action)} />
          ) : null}
        </span>
      )}
    </SortableRow>
  )
}

function SlotFace({ action, floating = false }: { action: ActionId; floating?: boolean }) {
  const accent = accentStyleOf(action)
  return (
    <span
      style={{ backgroundColor: accent.fill } as CSSProperties}
      className={cn(
        'grid size-9 place-items-center rounded-tile [&_svg]:size-4',
        floating && 'shadow-elevated',
        accent.ink === 'dark' ? 'text-(--p-navy-900)' : 'text-white',
      )}
    >
      {actionIcon(action)}
    </span>
  )
}
