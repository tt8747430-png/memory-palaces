import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { roomsForPalace, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { createRoom, deleteRoom, editRoom, moveRoom } from '@/features/room'
import { RoomJourneyMap } from '@/widgets/room-journey-map'
import { Button } from '@/shared/ui'

export interface PalaceDetailPageProps {
  palaceId: string
  /** Provided by the route wrapper (kept out of the component so it stays router-free). */
  onBack?: () => void
}

/** Palace detail — the palace's ordered rooms with create/edit/delete/reorder, all
 * persisting offline through the injected room store. */
export function PalaceDetailPage({ palaceId, onBack }: PalaceDetailPageProps) {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const palace = usePalaceStore((state) => state.palaces.find((p) => p.id === palaceId))
  const allRooms = useRoomStore(selectRooms)
  const rooms = useMemo(() => roomsForPalace(allRooms, palaceId), [allRooms, palaceId])
  const [title, setTitle] = useState('')

  useEffect(() => {
    palaceStore.getState().start()
    roomStore.getState().start()
  }, [palaceStore, roomStore])

  const handleCreate = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    void createRoom(roomStore, palaceId, { title: trimmed })
    setTitle('')
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pt-safe pb-safe">
      <header className="pt-12">
        {onBack ? (
          <Button variant="ghost" size="sm" className="mb-3 -ml-3" onClick={onBack}>
            {t('palaceDetail.back')}
          </Button>
        ) : null}
        <h1 className="text-balance">{palace ? palace.name : t('palaceDetail.notFound')}</h1>
      </header>

      {palace ? (
        <>
          <form onSubmit={handleCreate} className="mt-6 flex gap-2">
            <input
              aria-label={t('rooms.createLabel')}
              placeholder={t('rooms.createPlaceholder')}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-11 flex-1 rounded-control border border-border bg-card px-4 text-heading"
            />
            <Button type="submit">{t('rooms.create')}</Button>
          </form>

          <section className="mt-6 flex-1">
            <h2 className="sr-only">{t('palaceDetail.roomsHeading')}</h2>
            <RoomJourneyMap
              rooms={rooms}
              onRename={(id, newTitle) => void editRoom(roomStore, id, { title: newTitle })}
              onDelete={(id) => void deleteRoom(roomStore, id)}
              onMoveUp={(id) => void moveRoom(roomStore, id, 'up')}
              onMoveDown={(id) => void moveRoom(roomStore, id, 'down')}
            />
          </section>
        </>
      ) : null}
    </main>
  )
}
