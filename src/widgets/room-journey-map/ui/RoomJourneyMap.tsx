import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, Pencil, Trash2, Zap } from 'lucide-react'
import type { Room } from '@/entities/room'
import { cn } from '@/shared/lib'
import { Button, cardSurface, IconButton, TextField } from '@/shared/ui'

export interface RoomJourneyMapProps {
  /** Rooms already ordered by their journey position. */
  rooms: Room[]
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  /** Open the room's content. Omitted in contexts without navigation (e.g. tests). */
  onOpen?: (id: string) => void
  /** Start a training session for the room. Omitted where navigation is absent. */
  onTrain?: (id: string) => void
}

/** The ordered journey of a palace's rooms: a numbered path with inline rename,
 * reorder (up/down), and delete. Presentational — the page wires the commands. */
export function RoomJourneyMap({
  rooms,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
  onOpen,
  onTrain,
}: RoomJourneyMapProps) {
  const { t } = useTranslation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  if (rooms.length === 0) {
    return (
      <p className="rounded-card bg-card-glass p-6 text-center shadow-rest">{t('rooms.empty')}</p>
    )
  }

  const startEdit = (room: Room) => {
    setEditingId(room.id)
    setDraft(room.title)
  }

  const commitEdit = (id: string) => {
    const title = draft.trim()
    if (title) onRename(id, title)
    setEditingId(null)
  }

  return (
    <ol className="flex flex-col gap-3">
      {rooms.map((room, index) => (
        <motion.li
          key={room.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardSurface, 'flex items-center gap-3 px-3 py-2.5')}
        >
          <span
            aria-hidden
            className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[length:var(--p-text-label)] font-semibold text-secondary-foreground"
          >
            {index + 1}
          </span>

          {editingId === room.id ? (
            <div className="flex flex-1 items-center gap-2">
              <TextField
                aria-label={t('rooms.renameLabel', { title: room.title })}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && commitEdit(room.id)}
                autoFocus
              />
              <Button size="sm" onClick={() => commitEdit(room.id)}>
                {t('rooms.save')}
              </Button>
            </div>
          ) : (
            <>
              <RoomSummary
                room={room}
                onOpen={onOpen}
                openLabel={t('rooms.openLabel', { title: room.title })}
              />
              <div className="ml-auto flex shrink-0 items-center gap-0.5">
                {onTrain ? (
                  <IconButton
                    size="sm"
                    variant="tint"
                    aria-label={t('rooms.trainLabel', { title: room.title })}
                    onClick={() => onTrain(room.id)}
                  >
                    <Zap className="size-4" aria-hidden />
                  </IconButton>
                ) : null}
                <IconButton
                  size="sm"
                  aria-label={t('rooms.moveUpLabel', { title: room.title })}
                  disabled={index === 0}
                  onClick={() => onMoveUp(room.id)}
                >
                  <ArrowUp className="size-4" aria-hidden />
                </IconButton>
                <IconButton
                  size="sm"
                  aria-label={t('rooms.moveDownLabel', { title: room.title })}
                  disabled={index === rooms.length - 1}
                  onClick={() => onMoveDown(room.id)}
                >
                  <ArrowDown className="size-4" aria-hidden />
                </IconButton>
                <IconButton
                  size="sm"
                  aria-label={t('rooms.renameLabel', { title: room.title })}
                  onClick={() => startEdit(room)}
                >
                  <Pencil className="size-4" aria-hidden />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="danger"
                  aria-label={t('rooms.deleteLabel', { title: room.title })}
                  onClick={() => onDelete(room.id)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </IconButton>
              </div>
            </>
          )}
        </motion.li>
      ))}
    </ol>
  )
}

function RoomSummary({
  room,
  onOpen,
  openLabel,
}: {
  room: Room
  onOpen?: (id: string) => void
  openLabel: string
}) {
  const content = (
    <>
      <h3 className="truncate">{room.title}</h3>
      {room.description ? (
        <p className="truncate text-[length:var(--p-text-label)]">{room.description}</p>
      ) : null}
    </>
  )

  if (!onOpen) {
    return <div className="min-w-0 flex-1">{content}</div>
  }
  return (
    <button
      type="button"
      aria-label={openLabel}
      onClick={() => onOpen(room.id)}
      className="min-w-0 flex-1 rounded-control px-1 py-1 text-left transition-transform duration-150 ease-out active:scale-[0.99]"
    >
      {content}
    </button>
  )
}
