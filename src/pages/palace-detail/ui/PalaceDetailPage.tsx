import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Brain, Plus } from 'lucide-react'
import { usePalaceStore, usePalaceStoreApi } from '@/entities/palace'
import { roomsForPalace, selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { createRoom, deleteRoom, editRoom, moveRoom } from '@/features/room'
import { RoomJourneyMap } from '@/widgets/room-journey-map'
import { AppScreen, Chip, IconButton, ScreenHeader, TextField } from '@/shared/ui'

export interface PalaceDetailPageProps {
  palaceId: string
  /** Provided by the route wrapper (kept out of the component so it stays router-free). */
  onBack?: () => void
  /** Open a room's content; wired by the route wrapper. */
  onOpenRoom?: (roomId: string) => void
  /** Start training a room; wired by the route wrapper. */
  onTrainRoom?: (roomId: string) => void
  /** Quiz the whole palace; wired by the route wrapper. */
  onQuiz?: () => void
}

/** Palace detail — the palace's ordered rooms with create/edit/delete/reorder, all
 * persisting offline through the injected room store. */
export function PalaceDetailPage({
  palaceId,
  onBack,
  onOpenRoom,
  onTrainRoom,
  onQuiz,
}: PalaceDetailPageProps) {
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
    <AppScreen
      header={
        <ScreenHeader
          title={palace ? palace.name : t('palaceDetail.notFound')}
          onBack={onBack}
          backLabel={t('palaceDetail.back')}
          action={
            palace ? (
              <div className="flex items-center gap-2">
                {rooms.length > 0 ? <Chip>{rooms.length}</Chip> : null}
                {onQuiz ? (
                  <IconButton
                    variant="tint"
                    aria-label={t('palaceDetail.quizLabel', { name: palace.name })}
                    onClick={onQuiz}
                  >
                    <Brain className="size-5" aria-hidden />
                  </IconButton>
                ) : null}
              </div>
            ) : undefined
          }
        />
      }
    >
      {palace ? (
        <>
          <form onSubmit={handleCreate} className="mt-4 flex items-center gap-2">
            <TextField
              aria-label={t('rooms.createLabel')}
              placeholder={t('rooms.createPlaceholder')}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <IconButton
              type="submit"
              variant="solid"
              aria-label={t('rooms.create')}
              disabled={title.trim() === ''}
            >
              <Plus className="size-5" aria-hidden />
            </IconButton>
          </form>

          <section className="mt-6 flex-1 pb-8">
            <h2 className="sr-only">{t('palaceDetail.roomsHeading')}</h2>
            <RoomJourneyMap
              rooms={rooms}
              onOpen={onOpenRoom}
              onTrain={onTrainRoom}
              onRename={(id, newTitle) => void editRoom(roomStore, id, { title: newTitle })}
              onDelete={(id) => void deleteRoom(roomStore, id)}
              onMoveUp={(id) => void moveRoom(roomStore, id, 'up')}
              onMoveDown={(id) => void moveRoom(roomStore, id, 'down')}
            />
          </section>
        </>
      ) : null}
    </AppScreen>
  )
}
