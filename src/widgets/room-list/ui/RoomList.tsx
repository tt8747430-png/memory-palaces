import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  GraduationCap,
  HelpCircle,
  MapPin,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { cn } from '@/shared/lib'
import { OverflowMenuButton, type SheetAction, SwipeRow } from '@/shared/ui'
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
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onDuplicate: (id: string) => void
  /** Request a reset — the page gates it behind a confirm dialog. */
  onResetProgress: (id: string) => void
  /** Request deletion — the page gates it behind a confirm dialog. */
  onDelete: (id: string) => void
}

export interface RoomListProps extends RoomListHandlers {
  rooms: RoomListItem[]
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** The palace's ordered rooms as rich, derived-progress cards: a position medallion (a
 * check once complete), the title + description, a reviewed-progress bar, and a stats row
 * (loci · questions · mastered · due). Swipe-left to delete; a ⋮ overflow carries the full
 * set (edit, reorder, duplicate, reset, delete). Presentational — the page derives the
 * items and wires the commands. */
export function RoomList({
  rooms,
  onOpen,
  onEdit,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onResetProgress,
  onDelete,
}: RoomListProps) {
  const reduce = useReducedMotion()
  // Bumped after a swipe-delete fires so the swiped card remounts at rest — if the
  // page's confirm dialog is dismissed, the row isn't left slid off-screen.
  const [swipeReset, setSwipeReset] = useState(0)
  const handlers: RoomListHandlers = {
    onOpen,
    onEdit,
    onMoveUp,
    onMoveDown,
    onDuplicate,
    onResetProgress,
    onDelete,
  }

  return (
    <ol className="flex flex-col gap-3">
      {rooms.map((room, index) => (
        <motion.li
          key={room.id}
          layout
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.35, ease: EASE_OUT }}
        >
          <RoomCard
            key={`${room.id}:${swipeReset}`}
            room={room}
            canMoveUp={index > 0}
            canMoveDown={index < rooms.length - 1}
            handlers={handlers}
            onSwipeDelete={() => {
              onDelete(room.id)
              setSwipeReset((value) => value + 1)
            }}
          />
        </motion.li>
      ))}
    </ol>
  )
}

function useRoomActions(
  room: RoomListItem,
  canMoveUp: boolean,
  canMoveDown: boolean,
  handlers: RoomListHandlers,
): SheetAction[] {
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
      id: 'move-up',
      label: t('rooms.menu.moveUp'),
      icon: <ArrowUp className="size-5" aria-hidden />,
      disabled: !canMoveUp,
      onSelect: () => handlers.onMoveUp(room.id),
    },
    {
      id: 'move-down',
      label: t('rooms.menu.moveDown'),
      icon: <ArrowDown className="size-5" aria-hidden />,
      disabled: !canMoveDown,
      onSelect: () => handlers.onMoveDown(room.id),
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
  canMoveUp,
  canMoveDown,
  handlers,
  onSwipeDelete,
}: {
  room: RoomListItem
  canMoveUp: boolean
  canMoveDown: boolean
  handlers: RoomListHandlers
  onSwipeDelete: () => void
}) {
  const { t } = useTranslation()
  const actions = useRoomActions(room, canMoveUp, canMoveDown, handlers)
  const pct = Math.min(100, Math.max(0, Math.round(room.progress)))
  const statusLabel = room.completed
    ? t('rooms.card.complete')
    : t('rooms.card.progress', { percent: pct })

  return (
    // The menu lives inside the swiped content (as a sibling of the card button, not nested
    // in it) so it travels with the card on swipe instead of staying pinned behind it.
    <SwipeRow onSwipe={onSwipeDelete}>
      <div className="relative">
        <motion.button
          type="button"
          whileTap={{ scale: 0.99 }}
          onClick={() => handlers.onOpen(room.id)}
          aria-label={t('rooms.openLabel', { title: room.title })}
          className="block w-full rounded-card bg-card p-3.5 pr-12 text-left shadow-rest"
        >
          <div className="flex items-start gap-3">
            <Medallion position={room.position} completed={room.completed} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-(length:--p-text-sub) font-semibold text-heading">
                {room.title}
              </h3>
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
        </motion.button>

        <div className="absolute right-2 top-2.5">
          <OverflowMenuButton
            variant="glass"
            size="sm"
            label={t('rooms.menu.label', { title: room.title })}
            actions={actions}
          />
        </div>
      </div>
    </SwipeRow>
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
      <Stat
        icon={<GraduationCap className="size-3.5 text-(--success-foreground)" aria-hidden />}
      >
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
