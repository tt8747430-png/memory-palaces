import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import type { Room } from '@/entities/room'
import { Button } from '@/shared/ui'

export interface RoomJourneyMapProps {
  /** Rooms already ordered by their journey position. */
  rooms: Room[]
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  /** Open the room's content. Omitted in contexts without navigation (e.g. tests). */
  onOpen?: (id: string) => void
}

/** The ordered journey of a palace's rooms. Presentational — the page passes the
 * ordered rooms and wires the room commands. Reorder is exposed as up/down controls
 * (a drag gesture via @use-gesture can layer on later). */
export function RoomJourneyMap({
  rooms,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
  onOpen,
}: RoomJourneyMapProps) {
  const { t } = useTranslation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  if (rooms.length === 0) {
    return (
      <p className="rounded-card bg-card-glass p-5 text-center shadow-rest">{t('rooms.empty')}</p>
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
          className="flex items-start gap-3 rounded-card bg-card-glass p-4 shadow-rest"
        >
          <span
            aria-hidden
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          >
            {index + 1}
          </span>

          <div className="min-w-0 flex-1">
            {editingId === room.id ? (
              <div className="flex gap-2">
                <input
                  aria-label={t('rooms.renameLabel', { title: room.title })}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && commitEdit(room.id)}
                  autoFocus
                  className="h-11 flex-1 rounded-control border border-border bg-card px-3 text-heading"
                />
                <Button size="sm" onClick={() => commitEdit(room.id)}>
                  {t('rooms.save')}
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-heading">{room.title}</h3>
                  {room.description ? (
                    <p className="truncate text-sm text-muted-foreground">{room.description}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  {onOpen ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={t('rooms.openLabel', { title: room.title })}
                      onClick={() => onOpen(room.id)}
                    >
                      {t('rooms.open')}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t('rooms.moveUpLabel', { title: room.title })}
                    disabled={index === 0}
                    onClick={() => onMoveUp(room.id)}
                  >
                    {t('rooms.moveUp')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t('rooms.moveDownLabel', { title: room.title })}
                    disabled={index === rooms.length - 1}
                    onClick={() => onMoveDown(room.id)}
                  >
                    {t('rooms.moveDown')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t('rooms.renameLabel', { title: room.title })}
                    onClick={() => startEdit(room)}
                  >
                    {t('rooms.rename')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    aria-label={t('rooms.deleteLabel', { title: room.title })}
                    onClick={() => onDelete(room.id)}
                  >
                    {t('rooms.delete')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.li>
      ))}
    </ol>
  )
}
