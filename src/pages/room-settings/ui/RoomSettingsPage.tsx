import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Copy, DoorOpen, GraduationCap, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { deleteRoom, duplicateRoom, RoomEditorSheet } from '@/features/room'
import { markRoomKnown, resetRoomSrs } from '@/features/locus'
import {
  type Room,
  selectIsReady as selectRoomsReady,
  useRoomStore,
  useRoomStoreApi,
} from '@/entities/room'
import {
  lociForRoom,
  selectIsReady as selectLociReady,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import {
  selectIsReady as selectQuestionsReady,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import {
  AppScreen,
  ConfirmDialog,
  ScreenHeader,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'

export interface RoomSettingsPageProps {
  roomId: string
  onBack?: () => void
  /** Navigate away once the room is deleted — back to its palace. */
  onExit?: (palaceId: string) => void
}

/** Per-room settings — the room counterpart to {@link PalaceSettingsPage}. A tappable identity
 * header (opens the name/description editor), manage actions (duplicate, mark known, reset), and
 * delete. Every change persists through the room/locus command layer. */
export function RoomSettingsPage({ roomId, onBack, onExit }: RoomSettingsPageProps) {
  const { t } = useTranslation()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()

  useEffect(() => {
    roomStore.getState().start()
    locusStore.getState().start()
    questionStore.getState().start()
  }, [roomStore, locusStore, questionStore])

  const room = useRoomStore((state) => state.rooms.find((candidate) => candidate.id === roomId))
  const roomsReady = useRoomStore(selectRoomsReady)
  const lociReady = useLocusStore(selectLociReady)
  const questionsReady = useQuestionStore(selectQuestionsReady)
  const ready = roomsReady && lociReady && questionsReady

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  if (!room) {
    return (
      <AppScreen
        header={
          <ScreenHeader
            title={t('roomSettings.notFound')}
            onBack={onBack}
            backLabel={t('roomSettings.back')}
          />
        }
      />
    )
  }

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader
          title={t('roomSettings.title')}
          subtitle={room.title}
          onBack={onBack}
          backLabel={t('roomSettings.back')}
        />
      }
    >
      <RoomSettingsForm room={room} onExit={onExit} />
    </AppScreen>
  )
}

function RoomSettingsForm({ room, onExit }: { room: Room; onExit?: (palaceId: string) => void }) {
  const { t } = useTranslation()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()
  const loci = useLocusStore(selectLoci)
  const hasLoci = lociForRoom(loci, room.id).length > 0

  const [editorOpen, setEditorOpen] = useState(false)
  const [knownOpen, setKnownOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className="mt-4 flex flex-col gap-6 pb-28">
      {/* Identity — tap to edit the room's name & description. */}
      <button
        type="button"
        onClick={() => setEditorOpen(true)}
        aria-label={t('roomSettings.editDetails')}
        className="flex items-center gap-3.5 rounded-card bg-card p-4 text-left shadow-rest transition-transform active:scale-[0.99]"
      >
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center rounded-card bg-info-surface text-accent shadow-rest"
        >
          <DoorOpen className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[length:var(--p-text-title)] font-bold tracking-tight text-heading">
            {room.title}
          </p>
          <p className="mt-0.5 truncate text-[length:var(--p-text-label)] text-muted-foreground">
            {room.description || t('roomSettings.editDetailsHint')}
          </p>
        </div>
        <Pencil className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {/* Manage — action rows, not nav: each fires in place (or opens its confirm). */}
      <SettingsSection title={t('roomSettings.manage')}>
        <SettingsRow
          kind="action"
          icon={<Copy />}
          label={t('roomSettings.duplicate')}
          description={t('roomSettings.duplicateHint')}
          onClick={() => {
            void duplicateRoom(roomStore, locusStore, questionStore, room.id)
            toast.success(t('roomSettings.toast.duplicated'))
          }}
        />
        <SettingsRow
          kind="action"
          icon={<GraduationCap />}
          label={t('roomSettings.markKnown')}
          description={t('roomSettings.markKnownHint')}
          disabled={!hasLoci}
          onClick={() => setKnownOpen(true)}
        />
        <SettingsRow
          kind="action"
          icon={<RotateCcw />}
          label={t('roomSettings.resetProgress')}
          description={t('roomSettings.resetProgressHint')}
          disabled={!hasLoci}
          onClick={() => setResetOpen(true)}
        />
      </SettingsSection>

      {/* Delete */}
      <SettingsSection>
        <SettingsRow
          kind="action"
          tone="danger"
          icon={<Trash2 />}
          label={t('roomSettings.delete')}
          description={t('roomSettings.deleteHint')}
          onClick={() => setDeleteOpen(true)}
        />
      </SettingsSection>

      <RoomEditorSheet
        store={roomStore}
        target={editorOpen ? { mode: 'edit', room } : null}
        onOpenChange={(open) => !open && setEditorOpen(false)}
        onSaved={() => toast.success(t('roomSettings.toast.saved'))}
      />

      {/* Marking every card known rewrites each schedule irreversibly — same confirm
          treatment as reset, which is the same class of mutation. */}
      <ConfirmDialog
        open={knownOpen}
        onOpenChange={setKnownOpen}
        icon={<GraduationCap className="size-6" aria-hidden />}
        title={t('roomSettings.markKnownConfirm.title')}
        description={t('roomSettings.markKnownConfirm.body')}
        confirmLabel={t('roomSettings.markKnownConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          void markRoomKnown(locusStore, room.id)
          toast.success(t('roomSettings.toast.markedKnown'))
        }}
      />

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        icon={<RotateCcw className="size-6" aria-hidden />}
        title={t('roomSettings.resetConfirm.title')}
        description={t('roomSettings.resetConfirm.body')}
        confirmLabel={t('roomSettings.resetConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          void resetRoomSrs(locusStore, room.id)
          toast.success(t('roomSettings.toast.reset'))
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('roomSettings.deleteConfirm.title', { title: room.title })}
        description={t('roomSettings.deleteConfirm.body')}
        confirmLabel={t('roomSettings.deleteConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          void deleteRoom(roomStore, room.id)
          toast.success(t('roomSettings.toast.deleted'))
          onExit?.(room.palaceId)
        }}
      />
    </div>
  )
}
