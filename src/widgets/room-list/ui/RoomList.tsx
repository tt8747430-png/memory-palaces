import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'motion/react'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Check,
  Copy,
  GraduationCap,
  HelpCircle,
  MapPin,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { cn, useLongPress } from '@/shared/lib'
import type { SwipeConfig } from '@/shared/config/swipe'
import {
  buildSwipeActions,
  EditableTitle,
  OverflowMenuButton,
  type SheetAction,
  SwipeRow,
} from '@/shared/ui'
import * as React from 'react'

/** A room plus the progress derived from its loci/questions — everything a card renders. */
export interface RoomListItem {
  id: string
  title: string
  description: string
  /** 1-based position along the palace's route, shown in the medallion. */
  position: number
  lociCount: number
  questionCount: number
  /** Cards whose interval has matured (SRS `known`). */
  knownCount: number
  /** Cards due for review now. */
  dueCount: number
  /** Cards that have left "new" (the headline progress signal). */
  reviewedCount: number
  /** Reviewed share, 0–100. */
  progress: number
  completed: boolean
}

export interface RoomListHandlers {
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  /** Rename a room in place (from tapping its title). */
  onRename: (id: string, title: string) => void
  onDuplicate: (id: string) => void
  /** Persist a new manual room order (passes the ids in their final order). */
  onReorder: (orderedIds: string[]) => void
  /** Request a reset — the page gates it behind a confirm dialog. */
  onResetProgress: (id: string) => void
  /** Request deletion — the page gates it behind a confirm dialog. */
  onDelete: (id: string) => void
}

export interface RoomListProps extends RoomListHandlers {
  rooms: RoomListItem[]
  /** The user's swipe-gesture mapping for room rows (leading/trailing action trays). */
  swipe: SwipeConfig
  /** Multi-select mode: rows grow a grip + checkbox; taps toggle, a grip-drag reorders,
   * swipe is suspended. Entered by long-pressing a row (the page owns the flag). */
  selectMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  /** Long-press on a row: enter select mode with this room picked. */
  onRequestSelect: (id: string) => void
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** The palace's rooms as rich, derived-progress cards: a position medallion (a check once
 * complete), the title + description, a reviewed-progress bar, and a stats row (loci ·
 * questions · mastered · due). At rest a tap opens the room, a swipe runs the user's
 * configured action, and a long-press enters multi-select. In select mode each card grows a
 * grip + checkbox: taps toggle the pick and a grip-drag reorders the route (manual sort).
 * Presentational — the page derives the items, owns the selection/sort, and wires the
 * commands; the reorder applies to a local copy first so cards settle straight into place. */
export function RoomList({
  rooms,
  swipe,
  selectMode,
  selectedIds,
  onToggleSelect,
  onRequestSelect,
  ...handlers
}: RoomListProps) {
  const reduce = useReducedMotion()
  // Bumped after a swipe-delete fires so the swiped card remounts at rest — if the
  // page's confirm dialog is dismissed, the row isn't left slid off-screen.
  const [swipeReset, setSwipeReset] = useState(0)
  // Optimistic order: seeded from props, reordered in place on drop, reconciled when the
  // persisted order flows back. Kills the reorder flicker between drop and store update.
  const [items, setItems] = useState(rooms)
  useEffect(() => setItems(rooms), [rooms])
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = items.findIndex((room) => room.id === active.id)
    const to = items.findIndex((room) => room.id === over.id)
    if (from < 0 || to < 0) return
    const next = arrayMove(items, from, to)
    setItems(next)
    handlers.onReorder(next.map((room) => room.id))
  }

  const onSwipeDelete = (id: string) => {
    handlers.onDelete(id)
    setSwipeReset((value) => value + 1)
  }

  const activeRoom = activeId ? items.find((room) => room.id === activeId) : undefined

  const list = (
    <ol className="flex flex-col gap-3">
      {items.map((room, index) => (
        <SortableRoom
          key={`${room.id}:${swipeReset}`}
          room={room}
          index={index}
          selectMode={selectMode}
          selected={selectedIds.has(room.id)}
          dragActive={activeId !== null}
          reduce={reduce}
          swipe={swipe}
          handlers={handlers}
          onToggleSelect={() => onToggleSelect(room.id)}
          onRequestSelect={() => onRequestSelect(room.id)}
          onSwipeDelete={() => onSwipeDelete(room.id)}
        />
      ))}
    </ol>
  )

  // The DndContext stays mounted (mirroring the library) so entering select mode never
  // re-mounts the list and replays its entrance stagger; each row's sortable is disabled until
  // then, so at rest a tap or swipe is never intercepted by the sensors. Reorder is a
  // grip-drag, offered only in select mode.
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items.map((room) => room.id)} strategy={verticalListSortingStrategy}>
        {list}
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {activeRoom ? (
          <div className={cn('rounded-card shadow-elevated', !reduce && 'scale-[1.02]')}>
            <RoomCard
              room={activeRoom}
              dragging
              selectMode
              selected={selectedIds.has(activeRoom.id)}
              swipe={swipe}
              handlers={handlers}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function SortableRoom({
  room,
  index,
  selectMode,
  selected,
  dragActive,
  reduce,
  swipe,
  handlers,
  onToggleSelect,
  onRequestSelect,
  onSwipeDelete,
}: {
  room: RoomListItem
  index: number
  selectMode: boolean
  selected: boolean
  dragActive: boolean
  reduce: boolean | null
  swipe: SwipeConfig
  handlers: RoomListHandlers
  onToggleSelect: () => void
  onRequestSelect: () => void
  onSwipeDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: room.id, disabled: !selectMode })

  // Motion owns the entrance stagger on the <li>; dnd-kit owns the drag transform on the
  // inner node (kept separate so the two transform engines never fight).
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: dragActive ? 0 : index * 0.04, duration: 0.35, ease: EASE_OUT }}
    >
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        // The source slot holds a faint ghost while its DragOverlay clone is in hand, so the
        // siblings settle into the gap instead of lurching.
        className={cn(isDragging && 'relative z-50 opacity-35')}
      >
        <RoomCard
          room={room}
          selectMode={selectMode}
          selected={selected}
          dragActive={dragActive}
          handleRef={setActivatorNodeRef}
          handleProps={{ ...attributes, ...listeners }}
          swipe={swipe}
          handlers={handlers}
          onToggleSelect={onToggleSelect}
          onRequestSelect={onRequestSelect}
          onSwipeDelete={onSwipeDelete}
        />
      </div>
    </motion.li>
  )
}

function useRoomActions(room: RoomListItem, handlers: RoomListHandlers): SheetAction[] {
  const { t } = useTranslation()
  const hasProgress = room.reviewedCount > 0 || room.completed
  return [
    {
      id: 'edit',
      label: t('rooms.menu.edit'),
      icon: <Pencil className="size-5" aria-hidden />,
      onSelect: () => handlers.onEdit(room.id),
    },
    {
      id: 'duplicate',
      label: t('rooms.menu.duplicate'),
      icon: <Copy className="size-5" aria-hidden />,
      onSelect: () => handlers.onDuplicate(room.id),
    },
    {
      id: 'reset',
      label: t('rooms.menu.reset'),
      icon: <RotateCcw className="size-5" aria-hidden />,
      disabled: !hasProgress,
      onSelect: () => handlers.onResetProgress(room.id),
    },
    {
      id: 'delete',
      label: t('rooms.menu.delete'),
      icon: <Trash2 className="size-5" aria-hidden />,
      destructive: true,
      onSelect: () => handlers.onDelete(room.id),
    },
  ]
}

function RoomCard({
  room,
  selectMode = false,
  selected = false,
  dragActive = false,
  dragging = false,
  handleRef,
  handleProps,
  swipe,
  handlers,
  onToggleSelect,
  onRequestSelect,
  onSwipeDelete,
}: {
  room: RoomListItem
  selectMode?: boolean
  selected?: boolean
  dragActive?: boolean
  dragging?: boolean
  handleRef?: (node: HTMLElement | null) => void
  /** dnd-kit's attributes + listeners, typed as an open record so spreading onto the motion
   * button never collides with motion's own gesture props. */
  handleProps?: Record<string, unknown>
  swipe: SwipeConfig
  handlers: RoomListHandlers
  onToggleSelect?: () => void
  onRequestSelect?: () => void
  onSwipeDelete?: () => void
}) {
  const { t } = useTranslation()
  const actions = useRoomActions(room, handlers)
  const hasProgress = room.reviewedCount > 0 || room.completed
  const { leading, trailing } = buildSwipeActions(
    swipe,
    {
      edit: { onAction: () => handlers.onEdit(room.id) },
      duplicate: { onAction: () => handlers.onDuplicate(room.id) },
      ...(hasProgress ? { reset: { onAction: () => handlers.onResetProgress(room.id) } } : {}),
      delete: { onAction: () => onSwipeDelete?.() },
    },
    t,
  )
  const press = useLongPress({
    onLongPress: () => onRequestSelect?.(),
    onTap: () => handlers.onOpen(room.id),
  })
  const pct = Math.min(100, Math.max(0, Math.round(room.progress)))
  const statusLabel = room.completed
    ? t('rooms.card.complete')
    : t('rooms.card.progress', { percent: pct })

  const card = (
    <div className="relative">
      <motion.div
        role="button"
        tabIndex={0}
        ref={selectMode && !dragging ? handleRef : undefined}
        whileTap={dragging ? undefined : { scale: 0.99 }}
        // In select mode the whole card is the drag activator (no visible grip): a tap still
        // toggles the pick — dnd-kit only starts the drag after real travel — and
        // `touch-none` hands the touch gesture to the pointer sensor, not the scroller.
        {...(selectMode || dragging
          ? { onClick: onToggleSelect, ...(dragging ? {} : handleProps) }
          : press)}
        onKeyDown={(event) => {
          if (dragging || event.key !== 'Enter') return
          event.preventDefault()
          if (selectMode) onToggleSelect?.()
          else handlers.onOpen(room.id)
        }}
        aria-label={
          selectMode
            ? t('rooms.selectLabel', { title: room.title })
            : t('rooms.openLabel', { title: room.title })
        }
        className={cn(
          'block w-full cursor-pointer rounded-card bg-card p-3.5 text-left shadow-rest',
          !selectMode && 'pr-12',
          selectMode && !dragging && 'touch-none',
          selected && 'ring-2 ring-primary',
        )}
      >
        <div className="flex items-start gap-3">
          {selectMode ? <SelectDot selected={selected} /> : null}
          <Medallion position={room.position} completed={room.completed} />
          <div className="min-w-0 flex-1">
            <EditableTitle
              value={room.title}
              onRename={(title) => handlers.onRename(room.id, title)}
              editLabel={t('rooms.renameLabel', { title: room.title })}
              disabled={selectMode || dragging}
              className="block max-w-full truncate text-(length:--p-text-sub) font-semibold text-heading"
            />
            {room.description ? (
              <p className="mt-0.5 truncate text-(length:--p-text-label) text-muted-foreground">
                {room.description}
              </p>
            ) : null}
          </div>
        </div>

        {room.lociCount > 0 ? (
          <div className="mt-3 flex items-center gap-2" role="img" aria-label={statusLabel}>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/40">
              <span
                className="block h-full rounded-full bg-linear-to-r from-primary to-accent"
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="text-(length:--p-text-tiny) font-bold tabular-nums text-primary">
              {pct}%
            </span>
          </div>
        ) : null}

        <RoomStats room={room} />
      </motion.div>

      {!selectMode && !dragging ? (
        <div className="absolute right-2 top-2.5">
          <OverflowMenuButton
            variant="glass"
            size="sm"
            label={t('rooms.menu.label', { title: room.title })}
            actions={actions}
          />
        </div>
      ) : null}
    </div>
  )

  // Swipe is the at-rest gesture only: it stands down while selecting, hand-reordering, or
  // riding in the drag overlay so the gestures never fight.
  if (dragging || selectMode || !onSwipeDelete) return card

  return (
    <SwipeRow leading={leading} trailing={trailing} disabled={dragActive}>
      {card}
    </SwipeRow>
  )
}

function SelectDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 shadow-rest transition-colors',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card-glass',
      )}
    >
      {selected ? <Check className="size-4" strokeWidth={3} /> : null}
    </span>
  )
}

function Medallion({ position, completed }: { position: number; completed: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-(length:--p-text-label) font-bold tabular-nums',
        completed
          ? 'bg-(--success-surface) text-(--success-on-surface)'
          : 'bg-secondary text-secondary-foreground',
      )}
    >
      {completed ? <Check className="size-4" /> : position}
    </span>
  )
}

function RoomStats({ room }: { room: RoomListItem }) {
  const { t } = useTranslation()
  if (room.lociCount === 0) {
    return (
      <p className="mt-2.5 text-(length:--p-text-label) text-muted-foreground">
        {t('rooms.card.empty')}
      </p>
    )
  }
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <Stat icon={<MapPin className="size-3.5 text-accent" aria-hidden />}>
        {t(room.lociCount === 1 ? 'rooms.card.lociOne' : 'rooms.card.lociOther', {
          count: room.lociCount,
        })}
      </Stat>
      {room.questionCount > 0 ? (
        <Stat icon={<HelpCircle className="size-3.5 text-accent" aria-hidden />}>
          {t(room.questionCount === 1 ? 'rooms.card.questionsOne' : 'rooms.card.questionsOther', {
            count: room.questionCount,
          })}
        </Stat>
      ) : null}
      <Stat icon={<GraduationCap className="size-3.5 text-(--success-foreground)" aria-hidden />}>
        {t('rooms.card.mastered', { known: room.knownCount, total: room.lociCount })}
      </Stat>
      {room.dueCount > 0 ? (
        <span className="inline-flex items-center rounded-pill bg-(--warning-surface) px-2 py-0.5 text-(length:--p-text-tiny) font-bold text-(--warning-foreground)">
          {t('rooms.card.due', { count: room.dueCount })}
        </span>
      ) : null}
    </div>
  )
}

function Stat({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-(length:--p-text-label) font-medium text-heading">
      {icon}
      {children}
    </span>
  )
}
