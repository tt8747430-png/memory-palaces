import { type ReactNode, useEffect, useRef, useState } from 'react'
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
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Archive,
  Check,
  FolderInput,
  FolderOpen,
  Heart,
  Pencil,
  Settings2,
  Trash2,
} from 'lucide-react'
import { cn } from '@/shared/lib'
import { FlyoutMenu, FolderGlyph, PalaceCover, type SheetAction, SwipeRow } from '@/shared/ui'

export interface LibraryFolderItem {
  id: string
  name: string
  color: string
  icon: string
  /** Palaces filed in this folder. */
  count: number
}

export interface LibraryPalaceItem {
  id: string
  name: string
  icon: string
  color: string
  image?: string
  category: string
  favorite: boolean
  archived: boolean
  folderId: string | null
  progress: number
  totalRooms: number
  dueCount: number
}

export interface LibraryHandlers {
  onOpenPalace: (id: string) => void
  onOpenPalaceSettings: (id: string) => void
  onToggleFavorite: (id: string) => void
  onMovePalace: (id: string) => void
  onArchivePalace: (id: string) => void
  onDeletePalace: (id: string) => void
  onOpenFolder: (id: string) => void
  onEditFolder: (id: string) => void
  onDeleteFolder: (id: string) => void
  /** Persist a new manual folder order (root only). */
  onReorderFolders: (orderedIds: string[]) => void
  /** Persist a new manual palace order within the current level. */
  onReorderPalaces: (orderedIds: string[]) => void
  /** File a palace into a folder by dragging it onto the folder card. */
  onFilePalace: (palaceId: string, folderId: string) => void
}

export interface LibraryGridProps extends LibraryHandlers {
  /** Folders at the current level (root only; empty inside a folder). */
  folders: LibraryFolderItem[]
  palaces: LibraryPalaceItem[]
  view: 'grid' | 'list'
  loading?: boolean
  emptyState: ReactNode
  /** Multi-select mode disables drag and turns taps into checkbox toggles. */
  selectMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
}

// Exponential ease-out + a calm spring, shared by the drop-target and receive animations.
const EASE_OUT = [0.22, 1, 0.36, 1] as const
const DROP_SPRING = { type: 'spring', stiffness: 420, damping: 26 } as const

// dnd ids are namespaced so a drag's source/target type is unambiguous: `f:` folder, `p:` palace.
const fid = (id: string) => `f:${id}`
const pid = (id: string) => `p:${id}`
const parseId = (raw: string): { kind: 'f' | 'p'; id: string } => ({
  kind: raw.slice(0, 1) as 'f' | 'p',
  id: raw.slice(2),
})

/** The library explorer: folder cards and palace cards together, reorderable by drag (manual
 * sort) and droppable — drag a palace onto a folder to file it. Presentational: the page owns
 * the data and commands and reacts to the drag/select callbacks. Reorders apply to a local
 * copy of the list the instant they happen, so the cards settle straight into place instead
 * of snapping back while the new order persists to the store. */
export function LibraryGrid({
  folders,
  palaces,
  view,
  loading = false,
  emptyState,
  selectMode,
  selectedIds,
  onToggleSelect,
  ...handlers
}: LibraryGridProps) {
  const reduce = useReducedMotion()
  const [activeId, setActiveId] = useState<string | null>(null)
  // The folder that just received a palace — drives a short "absorb" pop. Cleared on a timer.
  const [receivingId, setReceivingId] = useState<string | null>(null)
  const receiveTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(receiveTimer.current), [])
  // Optimistic order: seeded from props, reordered in place on drop, and reconciled
  // whenever the persisted order flows back. This is what kills the reorder flicker — the
  // grid never renders the stale order between the drop and the async store update.
  const [folderItems, setFolderItems] = useState(folders)
  const [palaceItems, setPalaceItems] = useState(palaces)
  useEffect(() => setFolderItems(folders), [folders])
  useEffect(() => setPalaceItems(palaces), [palaces])

  // Long-press to drag: a hold (not an immediate move) starts the drag, so a tap opens the
  // card and a horizontal flick is free to drive the swipe action / a scroll. `tolerance`
  // cancels the hold if the finger travels first (that's a scroll or a swipe, not a drag).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const flashReceive = (folderId: string) => {
    setReceivingId(folderId)
    window.clearTimeout(receiveTimer.current)
    receiveTimer.current = window.setTimeout(() => setReceivingId(null), 600)
  }

  if (loading) {
    return <GridSkeleton view={view} />
  }
  if (folders.length === 0 && palaces.length === 0) {
    return <>{emptyState}</>
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const a = parseId(String(active.id))
    const o = parseId(String(over.id))

    if (a.kind === 'p' && o.kind === 'f') {
      handlers.onFilePalace(a.id, o.id)
      flashReceive(o.id)
      return
    }
    if (a.kind === 'p' && o.kind === 'p') {
      const from = palaceItems.findIndex((p) => p.id === a.id)
      const to = palaceItems.findIndex((p) => p.id === o.id)
      if (from < 0 || to < 0) return
      const next = arrayMove(palaceItems, from, to)
      setPalaceItems(next)
      handlers.onReorderPalaces(next.map((p) => p.id))
      return
    }
    if (a.kind === 'f' && o.kind === 'f') {
      const from = folderItems.findIndex((f) => f.id === a.id)
      const to = folderItems.findIndex((f) => f.id === o.id)
      if (from < 0 || to < 0) return
      const next = arrayMove(folderItems, from, to)
      setFolderItems(next)
      handlers.onReorderFolders(next.map((f) => f.id))
    }
  }

  const onDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id))
  const active = activeId ? parseId(activeId) : null
  const activeFolder =
    active?.kind === 'f' ? folderItems.find((f) => f.id === active.id) : undefined
  const activePalace =
    active?.kind === 'p' ? palaceItems.find((p) => p.id === active.id) : undefined

  const strategy = view === 'grid' ? rectSortingStrategy : verticalListSortingStrategy
  const containerClass = view === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-2.5'

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className={containerClass}>
        <SortableContext items={folderItems.map((f) => fid(f.id))} strategy={strategy}>
          {folderItems.map((folder) => (
            <SortableItem key={folder.id} dndId={fid(folder.id)} disabled={selectMode}>
              {(drag) => (
                <FolderCard
                  folder={folder}
                  view={view}
                  selectMode={selectMode}
                  selected={selectedIds.has(folder.id)}
                  // A palace in hand turns every folder into a visible drop zone; the one
                  // under the cursor becomes the active "open" target.
                  dropReady={activePalace !== undefined}
                  isOver={drag.isOver && activePalace !== undefined}
                  receiving={receivingId === folder.id}
                  dragActive={activeId !== null}
                  reduce={reduce}
                  onToggleSelect={() => onToggleSelect(folder.id)}
                  handlers={handlers}
                />
              )}
            </SortableItem>
          ))}
        </SortableContext>

        <SortableContext items={palaceItems.map((p) => pid(p.id))} strategy={strategy}>
          {palaceItems.map((palace) => (
            <SortableItem key={palace.id} dndId={pid(palace.id)} disabled={selectMode}>
              {() => (
                <PalaceCard
                  item={palace}
                  view={view}
                  selectMode={selectMode}
                  selected={selectedIds.has(palace.id)}
                  dragActive={activeId !== null}
                  onToggleSelect={() => onToggleSelect(palace.id)}
                  handlers={handlers}
                />
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </div>

      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {activeFolder ? (
          <DragLift reduce={reduce}>
            <FolderCard
              folder={activeFolder}
              view={view}
              dragging
              reduce={reduce}
              handlers={handlers}
            />
          </DragLift>
        ) : activePalace ? (
          <DragLift reduce={reduce}>
            <PalaceCard item={activePalace} view={view} dragging handlers={handlers} />
          </DragLift>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

/** Lifts the dragged clone off the surface — a small, level scale-up that reads as "in hand"
 * (no tilt, so it stays square to the grid). Static so it composes cleanly with dnd-kit's
 * drop animation; the card itself carries the elevated shadow. No transform under reduced
 * motion. */
function DragLift({ children, reduce }: { children: ReactNode; reduce: boolean | null }) {
  return <div className={cn('origin-center', !reduce && 'scale-[1.03]')}>{children}</div>
}

function SortableItem({
  dndId,
  disabled,
  children,
}: {
  dndId: string
  disabled: boolean
  children: (drag: { isOver: boolean }) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: dndId, disabled })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        // The source slot holds its place (a faint ghost) while the DragOverlay clone is
        // dragged, so the surrounding cards don't lurch to fill the gap.
        opacity: isDragging ? 0.35 : 1,
      }}
      className={cn('touch-manipulation', isDragging && 'z-50')}
      {...attributes}
      {...listeners}
    >
      {children({ isOver })}
    </div>
  )
}

function FolderCard({
  folder,
  view,
  selectMode = false,
  selected = false,
  isOver = false,
  dropReady = false,
  receiving = false,
  dragging = false,
  dragActive = false,
  reduce = false,
  onToggleSelect,
  handlers,
}: {
  folder: LibraryFolderItem
  view: 'grid' | 'list'
  selectMode?: boolean
  selected?: boolean
  /** This folder is the active file target (a palace is hovering it). */
  isOver?: boolean
  /** A palace is being dragged anywhere — mark every folder as a droppable zone. */
  dropReady?: boolean
  /** Just received a palace — play the absorb pop. */
  receiving?: boolean
  dragging?: boolean
  /** A drag is in progress somewhere — suspends the swipe gesture so they never fight. */
  dragActive?: boolean
  reduce?: boolean | null
  onToggleSelect?: () => void
  handlers: LibraryHandlers
}) {
  const { t } = useTranslation()
  const countLabel = t(folder.count === 1 ? 'palaces.palaceCountOne' : 'palaces.palaceCountOther', {
    count: folder.count,
  })
  const actions: SheetAction[] = [
    {
      id: 'edit',
      label: t('palaces.editFolder'),
      icon: <Pencil className="size-5" aria-hidden />,
      onSelect: () => handlers.onEditFolder(folder.id),
    },
    {
      id: 'delete',
      label: t('palaces.deleteFolderAction'),
      icon: <Trash2 className="size-5" aria-hidden />,
      destructive: true,
      onSelect: () => handlers.onDeleteFolder(folder.id),
    },
  ]

  const handleClick = () => (selectMode ? onToggleSelect?.() : handlers.onOpenFolder(folder.id))

  const selectRing = selected ? 'ring-2 ring-primary' : 'ring-1 ring-border'
  const popTransition = receiving ? { duration: 0.5, ease: EASE_OUT } : DROP_SPRING

  // While hovered, the count line becomes a "drop to file" prompt so the gesture's outcome
  // is unmistakable.
  const subtitle = isOver ? (
    <span className="inline-flex items-center gap-1 font-semibold text-accent">
      <FolderOpen className="size-3.5" aria-hidden />
      {t('palaces.dropToFile')}
    </span>
  ) : (
    countLabel
  )

  if (view === 'list') {
    const animate = dragging
      ? undefined
      : reduce
        ? undefined
        : receiving
          ? { scale: [1, 1.03, 1] }
          : { scale: 1 }
    return (
      <motion.div
        className={cn('relative', dragging && 'rounded-card shadow-elevated')}
        animate={animate}
        transition={popTransition}
      >
        <SwipeRow
          onSwipe={() => handlers.onDeleteFolder(folder.id)}
          disabled={selectMode || dragActive || dragging}
          className="rounded-card"
        >
          <button
            type="button"
            onClick={handleClick}
            aria-label={t('palaces.openFolderLabel', { name: folder.name })}
            className={cn(
              'relative flex w-full items-center gap-3 rounded-card bg-card p-3 text-left shadow-rest',
              !selectMode && 'pr-12',
              selectRing,
            )}
          >
            {selectMode ? <SelectDot selected={selected} /> : null}
            <span className="relative shrink-0">
              {!dragging ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-1.5 -bottom-1 h-4 rounded-[7px] bg-secondary/60"
                />
              ) : null}
              <FolderGlyph
                color={folder.color}
                icon={folder.icon}
                className="relative size-14 rounded-card"
                iconClassName="text-2xl"
              />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[length:var(--p-text-sub)] font-bold tracking-tight text-heading">
                {folder.name}
              </h3>
              <p className="mt-0.5 truncate text-[length:var(--p-text-label)] text-muted-foreground">
                {subtitle}
              </p>
            </div>
          </button>
          {!selectMode && !dragging ? (
            <CardMenu label={t('palaces.folderActions', { name: folder.name })} actions={actions} />
          ) : null}
        </SwipeRow>
        <DropTargetRing ready={dropReady} active={isOver} reduce={reduce} />
      </motion.div>
    )
  }

  const animate = dragging
    ? undefined
    : reduce
      ? undefined
      : receiving
        ? { scale: [1, 1.1, 1] }
        : { scale: isOver ? 1.05 : 1 }

  return (
    <motion.div
      className={cn('relative h-full', dragging && 'rounded-card shadow-elevated')}
      animate={animate}
      transition={popTransition}
    >
      {/* Stacked sheets behind the card read it as a container of palaces — the at-rest cue
          that tells a folder from a palace at a glance. Hidden on the lifted drag clone. */}
      {!dragging ? (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-3 -bottom-1.5 h-6 rounded-card bg-secondary/45"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-2 -bottom-0.5 h-6 rounded-card bg-secondary/70"
          />
        </>
      ) : null}

      <button
        type="button"
        onClick={handleClick}
        aria-label={t('palaces.openFolderLabel', { name: folder.name })}
        className={cn(
          'relative flex h-full w-full flex-col gap-3 rounded-card bg-card p-3.5 text-left shadow-rest',
          selectRing,
        )}
      >
        <div className="flex items-center justify-between">
          <FolderGlyph
            color={folder.color}
            icon={folder.icon}
            className="size-12 shrink-0 rounded-card"
            iconClassName="text-2xl"
          />
          {selectMode ? <SelectDot selected={selected} /> : null}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-[length:var(--p-text-sub)] font-bold tracking-tight text-heading">
            {folder.name}
          </h3>
          <p className="mt-0.5 truncate text-[length:var(--p-text-label)] text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </button>
      <DropTargetRing ready={dropReady} active={isOver} reduce={reduce} />
      {!selectMode && !dragging ? (
        <CardMenu label={t('palaces.folderActions', { name: folder.name })} actions={actions} />
      ) : null}
    </motion.div>
  )
}

/** The drop-zone affordance laid over a folder while a palace is dragged: a dashed accent
 * outline marks every droppable folder; the one under the cursor fills to a solid accent
 * ring with a soft accent glow. Fades with opacity so toggling stays smooth. */
function DropTargetRing({
  ready,
  active,
  reduce,
}: {
  ready: boolean
  active: boolean
  reduce: boolean | null
}) {
  return (
    <motion.span
      aria-hidden
      initial={false}
      animate={{ opacity: ready ? 1 : 0 }}
      transition={{ duration: reduce ? 0 : 0.16, ease: 'easeOut' }}
      className={cn(
        'pointer-events-none absolute inset-0 rounded-card',
        active
          ? 'shadow-[0_10px_30px_oklch(66%_0.18_261_/_0.40)] ring-2 ring-accent'
          : 'outline-2 outline-offset-2 outline-dashed outline-accent/50',
      )}
    />
  )
}

function PalaceCard({
  item,
  view,
  selectMode = false,
  selected = false,
  dragging = false,
  dragActive = false,
  onToggleSelect,
  handlers,
}: {
  item: LibraryPalaceItem
  view: 'grid' | 'list'
  selectMode?: boolean
  selected?: boolean
  dragging?: boolean
  /** A drag is in progress somewhere — suspends the swipe gesture so they never fight. */
  dragActive?: boolean
  onToggleSelect?: () => void
  handlers: LibraryHandlers
}) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const actions = usePalaceActions(item, handlers)
  const roomsLabel = t(item.totalRooms === 1 ? 'palaces.roomCountOne' : 'palaces.roomCountOther', {
    count: item.totalRooms,
  })
  const handleClick = () => (selectMode ? onToggleSelect?.() : handlers.onOpenPalace(item.id))
  const ring = selected ? 'ring-2 ring-primary' : ''
  const coverVariant =
    item.color?.startsWith('from-') || item.color?.startsWith('#') ? 'identity' : 'brand'

  if (view === 'list') {
    return (
      <div
        className={cn(
          'relative',
          item.archived && 'opacity-75',
          dragging && 'rounded-card shadow-elevated',
        )}
      >
        <SwipeRow
          actions={[
            {
              id: 'archive',
              icon: <Archive className="size-5" aria-hidden />,
              label: t('palaces.archive'),
              tone: 'warning',
              onAction: () => handlers.onArchivePalace(item.id),
            },
            {
              id: 'delete',
              icon: <Trash2 className="size-5" aria-hidden />,
              label: t('palaces.delete'),
              tone: 'danger',
              onAction: () => handlers.onDeletePalace(item.id),
            },
          ]}
          disabled={selectMode || dragActive || dragging}
          className="rounded-card"
        >
          <button
            type="button"
            onClick={handleClick}
            aria-label={t('palaces.openLabel', { name: item.name })}
            className={cn(
              'flex w-full items-center gap-3 rounded-card bg-card p-3 text-left shadow-rest',
              !selectMode && 'pr-12',
              ring,
            )}
          >
            {selectMode ? <SelectDot selected={selected} /> : null}
            <PalaceCover
              icon={item.icon}
              color={item.color}
              image={item.image}
              variant={coverVariant}
              className="size-16 shrink-0 rounded-card"
              iconClassName="text-3xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {item.favorite ? (
                  <Heart className="size-4 shrink-0 fill-favorite text-favorite" aria-hidden />
                ) : null}
                <h3 className="truncate text-[length:var(--p-text-sub)] font-bold tracking-tight text-heading">
                  {item.name}
                </h3>
                {item.dueCount > 0 ? (
                  <DueTag text={t('palaces.dueCount', { count: item.dueCount })} />
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-[length:var(--p-text-label)] text-muted-foreground">
                {roomsLabel}
              </p>
              <div className="mt-2">
                <ProgressMeter
                  progress={item.progress}
                  label={t('palaces.progressLabel', { progress: Math.round(item.progress) })}
                />
              </div>
            </div>
          </button>
          {!selectMode && !dragging ? (
            <CardMenu label={t('palaces.moreLabel', { name: item.name })} actions={actions} />
          ) : null}
        </SwipeRow>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative',
        item.archived && 'opacity-75',
        dragging && 'rounded-card shadow-elevated',
      )}
    >
      <motion.button
        type="button"
        whileTap={reduce ? undefined : { scale: 0.98 }}
        onClick={handleClick}
        aria-label={t('palaces.openLabel', { name: item.name })}
        className={cn(
          'block w-full overflow-hidden rounded-card bg-card text-left shadow-rest',
          ring,
        )}
      >
        <div className="relative h-28">
          <PalaceCover
            icon={item.icon}
            color={item.color}
            image={item.image}
            variant={coverVariant}
            className="absolute inset-0"
            iconClassName="text-5xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/15 to-transparent"
          />
          {item.dueCount > 0 ? (
            <DueCoverPill text={t('palaces.dueCount', { count: item.dueCount })} />
          ) : null}
        </div>
        <div className="p-3.5">
          <h3 className="truncate text-[length:var(--p-text-title)] font-bold tracking-tight text-heading">
            {item.name}
          </h3>
          <p className="mt-0.5 truncate text-[length:var(--p-text-label)] text-muted-foreground">
            {roomsLabel}
          </p>
          <div className="mt-3">
            <ProgressMeter
              progress={item.progress}
              label={t('palaces.progressLabel', { progress: Math.round(item.progress) })}
            />
          </div>
        </div>
      </motion.button>

      <div className="pointer-events-none absolute left-2 top-2 flex gap-1.5">
        {item.favorite ? <FavoriteBadge /> : null}
      </div>

      {selectMode ? (
        <div className="absolute right-2 top-2">
          <SelectDot selected={selected} />
        </div>
      ) : !dragging ? (
        <CardMenu label={t('palaces.moreLabel', { name: item.name })} actions={actions} />
      ) : null}
    </div>
  )
}

function usePalaceActions(item: LibraryPalaceItem, handlers: LibraryHandlers): SheetAction[] {
  const { t } = useTranslation()
  return [
    {
      id: 'settings',
      label: t('palaces.settings'),
      icon: <Settings2 className="size-5" aria-hidden />,
      onSelect: () => handlers.onOpenPalaceSettings(item.id),
    },
    {
      id: 'favorite',
      label: item.favorite ? t('palaces.unfavorite') : t('palaces.favorite'),
      icon: (
        <Heart
          className={cn('size-5', item.favorite && 'fill-favorite text-favorite')}
          aria-hidden
        />
      ),
      onSelect: () => handlers.onToggleFavorite(item.id),
    },
    {
      id: 'move',
      label: item.folderId ? t('palaces.moveToFolder') : t('palaces.addToFolder'),
      icon: <FolderInput className="size-5" aria-hidden />,
      onSelect: () => handlers.onMovePalace(item.id),
    },
    {
      id: 'archive',
      label: item.archived ? t('palaces.restore') : t('palaces.archive'),
      icon: <Archive className="size-5" aria-hidden />,
      onSelect: () => handlers.onArchivePalace(item.id),
    },
    {
      id: 'delete',
      label: t('palaces.delete'),
      icon: <Trash2 className="size-5" aria-hidden />,
      destructive: true,
      onSelect: () => handlers.onDeletePalace(item.id),
    },
  ]
}

function SelectDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-full border-2 shadow-rest transition-colors',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card-glass',
      )}
    >
      {selected ? <Check className="size-4" strokeWidth={3} /> : null}
    </span>
  )
}

/** The card's ⋮ overflow as an anchored flyout (not a bottom drawer), pinned to the card's
 * top-right. Opens beside the thumb and dismisses on outside press. */
function CardMenu({ label, actions }: { label: string; actions: SheetAction[] }) {
  return (
    <div className="absolute right-2 top-2">
      <FlyoutMenu
        label={label}
        actions={actions}
        variant="glass"
        size="sm"
        side="bottom"
        align="end"
      />
    </div>
  )
}

function ProgressMeter({ progress, label }: { progress: number; label: string }) {
  const pct = Math.min(100, Math.max(0, Math.round(progress)))
  return (
    <div className="flex items-center gap-2" role="img" aria-label={label}>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary/40">
        <span
          className="block h-full rounded-full bg-linear-to-r from-primary to-accent"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="text-[length:var(--p-text-tiny)] font-bold tabular-nums text-primary">
        {pct}%
      </span>
    </div>
  )
}

function DueTag({ text }: { text: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-pill bg-[var(--warning-surface)] px-2 py-0.5 text-[length:var(--p-text-tiny)] font-bold text-[var(--warning-foreground)]">
      {text}
    </span>
  )
}

function DueCoverPill({ text }: { text: string }) {
  return (
    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-pill bg-card-glass px-2 py-0.5 shadow-rest">
      <span aria-hidden className="size-1.5 rounded-full bg-[var(--warning-foreground)]" />
      <span className="text-[length:var(--p-text-tiny)] font-bold text-heading">{text}</span>
    </span>
  )
}

function FavoriteBadge() {
  const { t } = useTranslation()
  return (
    <span
      className="grid size-7 place-items-center rounded-full bg-card-glass shadow-rest"
      role="img"
      aria-label={t('palaces.favoriteMarker')}
    >
      <Heart className="size-3.5 fill-favorite text-favorite" aria-hidden />
    </span>
  )
}

function GridSkeleton({ view }: { view: 'grid' | 'list' }) {
  const cells = Array.from({ length: 6 })
  if (view === 'list') {
    return (
      <div className="flex flex-col gap-2.5">
        {cells.map((_, i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-card bg-card shadow-rest" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {cells.map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-card bg-card shadow-rest" />
      ))}
    </div>
  )
}
