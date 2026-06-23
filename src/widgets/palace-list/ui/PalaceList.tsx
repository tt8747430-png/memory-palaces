import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'motion/react'
import {
  Archive,
  ArchiveRestore,
  ArrowUpRight,
  BookOpen,
  FolderInput,
  Heart,
  MoreVertical,
  Settings2,
  Trash2,
} from 'lucide-react'
import type { PalacesView } from '@/entities/preferences'
import { cn, impact, useLongPress } from '@/shared/lib'
import { ActionSheet, type SheetAction, IconButton, PalaceCover, SwipeRow } from '@/shared/ui'

/** A palace plus the progress derived from its rooms/loci — everything the list renders. */
export interface PalaceListItem {
  id: string
  name: string
  icon: string
  color: string
  image?: string
  category: string
  favorite: boolean
  bibleMode: boolean
  archived: boolean
  folderId: string | null
  /** For the "Recent" sort — the underlying palace's `updatedAt`. */
  updatedAt: string
  /** Mastery 0–100 (share of completed rooms). */
  progress: number
  roomsCompleted: number
  totalRooms: number
  /** Cards due for review right now — the pull back into practice. */
  dueCount: number
}

export interface PalaceListHandlers {
  onOpen: (id: string) => void
  /** Open the palace's settings directly from its overflow menu. */
  onOpenSettings: (id: string) => void
  onToggleFavorite: (id: string) => void
  onMove: (id: string) => void
  /** Archive a live palace, or restore an archived one. */
  onArchive: (id: string) => void
  /** Request deletion — the page gates this behind a confirm dialog. */
  onDelete: (id: string) => void
}

export interface PalaceListProps extends PalaceListHandlers {
  items: PalaceListItem[]
  view: PalacesView
  /** Render skeletons instead of content while the stores hydrate. */
  loading?: boolean
  /** Shown when there are no items (the page picks the right empty state). */
  emptyState: ReactNode
}

/** Presentational palace browser: a 2-up grid or a stacked list, each item carrying a
 * coral favorite marker, a scripture marker, real progress, and a ⋮ / long-press action
 * menu. Reads nothing from stores — the page passes derived items and wires commands —
 * so it stays reusable and easy to test. */
export function PalaceList({
  items,
  view,
  loading = false,
  emptyState,
  onOpen,
  onOpenSettings,
  onToggleFavorite,
  onMove,
  onArchive,
  onDelete,
}: PalaceListProps) {
  if (loading) {
    return view === 'grid' ? <GridSkeleton /> : <ListSkeleton />
  }
  if (items.length === 0) {
    return <>{emptyState}</>
  }

  const handlers: PalaceListHandlers = {
    onOpen,
    onOpenSettings,
    onToggleFavorite,
    onMove,
    onArchive,
    onDelete,
  }

  if (view === 'grid') {
    return (
      <ul className="grid grid-cols-2 gap-3">
        {items.map((item, index) => (
          <li key={item.id}>
            <PalaceCard item={item} index={index} handlers={handlers} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={item.id}>
          <PalaceRow item={item} index={index} handlers={handlers} />
        </li>
      ))}
    </ul>
  )
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const

function useActions(item: PalaceListItem, handlers: PalaceListHandlers): SheetAction[] {
  const { t } = useTranslation()
  const open: SheetAction = {
    id: 'open',
    label: t('palaces.open'),
    icon: <ArrowUpRight className="size-5" aria-hidden />,
    onSelect: () => handlers.onOpen(item.id),
  }
  const settings: SheetAction = {
    id: 'settings',
    label: t('palaces.settings'),
    icon: <Settings2 className="size-5" aria-hidden />,
    onSelect: () => handlers.onOpenSettings(item.id),
  }
  const archive: SheetAction = {
    id: 'archive',
    label: item.archived ? t('palaces.restore') : t('palaces.archive'),
    icon: item.archived ? (
      <ArchiveRestore className="size-5" aria-hidden />
    ) : (
      <Archive className="size-5" aria-hidden />
    ),
    onSelect: () => handlers.onArchive(item.id),
  }
  const remove: SheetAction = {
    id: 'delete',
    label: t('palaces.delete'),
    icon: <Trash2 className="size-5" aria-hidden />,
    destructive: true,
    onSelect: () => handlers.onDelete(item.id),
  }
  if (item.archived) {
    return [open, settings, archive, remove]
  }
  return [
    open,
    settings,
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
      onSelect: () => handlers.onMove(item.id),
    },
    archive,
    remove,
  ]
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

function BibleBadge() {
  const { t } = useTranslation()
  return (
    <span
      className="grid size-7 place-items-center rounded-full bg-card-glass shadow-rest"
      role="img"
      aria-label={t('palaces.bibleMarker')}
    >
      <BookOpen className="size-3.5 text-primary" aria-hidden />
    </span>
  )
}

function MenuButton({ onOpen, label }: { onOpen: () => void; label: string }) {
  return (
    <IconButton
      variant="glass"
      size="sm"
      aria-label={label}
      aria-haspopup="dialog"
      onClick={(event) => {
        event.stopPropagation()
        onOpen()
      }}
    >
      <MoreVertical className="size-4" aria-hidden />
    </IconButton>
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

/** Inline "N due" tag for the list row — the same warning pill the room list uses, so a
 * due count reads identically wherever it surfaces. */
function DueTag({ text }: { text: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-pill bg-[var(--warning-surface)] px-2 py-0.5 text-[length:var(--p-text-tiny)] font-bold text-[var(--warning-foreground)]">
      {text}
    </span>
  )
}

/** "N due" as a glass chip floated on the grid card's cover — gentle, legible over any
 * cover colour, and a quiet nudge that this palace owes the user a review today. */
function DueCoverPill({ text }: { text: string }) {
  return (
    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-pill bg-card-glass px-2 py-0.5 shadow-rest">
      <span aria-hidden className="size-1.5 rounded-full bg-[var(--warning-foreground)]" />
      <span className="text-[length:var(--p-text-tiny)] font-bold text-heading">{text}</span>
    </span>
  )
}

function PalaceCard({
  item,
  index,
  handlers,
}: {
  item: PalaceListItem
  index: number
  handlers: PalaceListHandlers
}) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const actions = useActions(item, handlers)
  const roomsLabel = t(item.totalRooms === 1 ? 'palaces.roomCountOne' : 'palaces.roomCountOther', {
    count: item.totalRooms,
  })
  const longPress = useLongPress({
    onTap: () => handlers.onOpen(item.id),
    onLongPress: () => {
      impact()
      setMenuOpen(true)
    },
  })

  return (
    <div className={cn('relative', item.archived && 'opacity-75')}>
      <motion.button
        type="button"
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.4, ease: EASE_OUT }}
        whileTap={{ scale: 0.98 }}
        aria-label={t('palaces.openLabel', { name: item.name })}
        className="block w-full overflow-hidden rounded-card bg-card text-left shadow-rest"
        {...longPress}
      >
        <div className="relative h-28">
          <PalaceCover
            icon={item.icon}
            color={item.color}
            image={item.image}
            variant={
              item.color?.startsWith('from-') || item.color?.startsWith('#') ? 'identity' : 'brand'
            }
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
        {item.bibleMode ? <BibleBadge /> : null}
      </div>

      <div className="absolute right-2 top-2">
        <MenuButton
          onOpen={() => setMenuOpen(true)}
          label={t('palaces.moreLabel', { name: item.name })}
        />
      </div>

      <ActionSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title={item.name}
        actions={actions}
        cancelLabel={t('common.cancel')}
      />
    </div>
  )
}

function PalaceRow({
  item,
  index,
  handlers,
}: {
  item: PalaceListItem
  index: number
  handlers: PalaceListHandlers
}) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const actions = useActions(item, handlers)
  const longPress = useLongPress({
    onTap: () => handlers.onOpen(item.id),
    onLongPress: () => {
      impact()
      setMenuOpen(true)
    },
  })

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.35, ease: EASE_OUT }}
      className={cn('relative isolate', item.archived && 'opacity-75')}
    >
      {/* Swipe-left tucks a live palace away (archive) — reversible, so a warning tone, not
          the destructive red. Archived rows disable it; their menu offers Restore. */}
      {/* Swipe-left tucks a live palace away (archive) — reversible, so a warning tone, not
          the destructive red. Archived rows disable it; their menu offers Restore. The menu
          lives inside the swiped content so it travels with the card, not pinned behind it. */}
      <SwipeRow
        onSwipe={() => handlers.onArchive(item.id)}
        revealIcon={<Archive className="size-5" aria-hidden />}
        tone="warning"
        disabled={item.archived}
      >
        <div className="relative">
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            aria-label={t('palaces.openLabel', { name: item.name })}
            className="flex w-full items-center gap-3 rounded-card bg-card p-3 pr-12 text-left shadow-rest"
            {...longPress}
          >
            <PalaceCover
              icon={item.icon}
              color={item.color}
              image={item.image}
              variant={
                item.color?.startsWith('from-') || item.color?.startsWith('#')
                  ? 'identity'
                  : 'brand'
              }
              className="size-16 shrink-0 rounded-card"
              iconClassName="text-3xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {item.favorite ? (
                  <Heart className="size-4 shrink-0 fill-favorite text-favorite" aria-hidden />
                ) : null}
                {item.bibleMode ? (
                  <BookOpen className="size-4 shrink-0 text-primary" aria-hidden />
                ) : null}
                <h3 className="truncate text-[length:var(--p-text-sub)] font-bold tracking-tight text-heading">
                  {item.name}
                </h3>
                {item.dueCount > 0 ? (
                  <DueTag text={t('palaces.dueCount', { count: item.dueCount })} />
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-[length:var(--p-text-label)]">
                {t(item.totalRooms === 1 ? 'palaces.roomCountOne' : 'palaces.roomCountOther', {
                  count: item.totalRooms,
                })}
                {item.category && item.category !== 'General' ? ` · ${item.category}` : ''}
              </p>
              <div className="mt-2">
                <ProgressMeter
                  progress={item.progress}
                  label={t('palaces.progressLabel', { progress: Math.round(item.progress) })}
                />
              </div>
            </div>
          </motion.button>

          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <MenuButton
              onOpen={() => setMenuOpen(true)}
              label={t('palaces.moreLabel', { name: item.name })}
            />
          </div>
        </div>
      </SwipeRow>

      <ActionSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title={item.name}
        actions={actions}
        cancelLabel={t('common.cancel')}
      />
    </motion.div>
  )
}

function GridSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={index} className="overflow-hidden rounded-card bg-card shadow-rest">
          <div className="h-28 animate-pulse bg-secondary/30" />
          <div className="space-y-2 p-3">
            <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-secondary/30" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-secondary/20" />
            <div className="h-1.5 w-full animate-pulse rounded-full bg-secondary/20" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index} className="flex items-center gap-3 rounded-card bg-card p-3 shadow-rest">
          <div className="size-16 shrink-0 animate-pulse rounded-card bg-secondary/30" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-secondary/30" />
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-secondary/20" />
            <div className="h-1.5 w-full animate-pulse rounded-full bg-secondary/20" />
          </div>
        </li>
      ))}
    </ul>
  )
}
