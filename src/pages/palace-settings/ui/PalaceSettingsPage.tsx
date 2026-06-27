import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Archive,
  ArchiveRestore,
  Copy,
  Download,
  FileText,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  deletePalace,
  duplicatePalace,
  exportPalaceAnki,
  exportPalaceJson,
  setPalaceArchived,
} from '@/features/palace'
import { resetPalaceSrs } from '@/features/locus'
import {
  type Palace,
  selectIsReady as selectPalacesReady,
  usePalaceStore,
  usePalaceStoreApi,
} from '@/entities/palace'
import {
  selectIsReady as selectRoomsReady,
  selectRooms,
  useRoomStore,
  useRoomStoreApi,
} from '@/entities/room'
import {
  selectIsReady as selectLociReady,
  selectLoci,
  useLocusStore,
  useLocusStoreApi,
} from '@/entities/locus'
import {
  selectIsReady as selectQuestionsReady,
  selectQuestions,
  useQuestionStore,
  useQuestionStoreApi,
} from '@/entities/question'
import { downloadText } from '@/shared/lib'
import { PalaceAppearanceSheet } from '@/widgets/appearance-sheet'
import {
  ActionSheet,
  AppScreen,
  ConfirmDialog,
  PalaceCover,
  ScreenHeader,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'

export interface PalaceSettingsPageProps {
  palaceId: string
  onBack?: () => void
  /** Navigate away once the palace is deleted. */
  onExit?: () => void
}

/** Per-palace settings — a tappable identity header (opens the appearance drawer), study
 * behaviour, manage (duplicate / export / reset / archive), and delete. Every change persists
 * through the palace command layer; study toggles read straight off the reactive palace, so
 * they can't drift. */
export function PalaceSettingsPage({ palaceId, onBack, onExit }: PalaceSettingsPageProps) {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()
  const [appearanceOpen, setAppearanceOpen] = useState(false)

  useEffect(() => {
    palaceStore.getState().start()
    roomStore.getState().start()
    locusStore.getState().start()
    questionStore.getState().start()
  }, [palaceStore, roomStore, locusStore, questionStore])

  const palace = usePalaceStore((state) =>
    state.palaces.find((candidate) => candidate.id === palaceId),
  )
  const palacesReady = usePalaceStore(selectPalacesReady)
  const roomsReady = useRoomStore(selectRoomsReady)
  const lociReady = useLocusStore(selectLociReady)
  const questionsReady = useQuestionStore(selectQuestionsReady)
  const ready = palacesReady && roomsReady && lociReady && questionsReady

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  if (!palace) {
    return (
      <AppScreen
        header={
          <ScreenHeader
            title={t('palaceSettings.notFound')}
            onBack={onBack}
            backLabel={t('palaceSettings.back')}
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
          title={t('palaceSettings.title')}
          subtitle={palace.name}
          onBack={onBack}
          backLabel={t('palaceSettings.back')}
        />
      }
    >
      <PalaceSettingsForm
        palace={palace}
        onExit={onExit}
        appearanceOpen={appearanceOpen}
        onAppearanceOpenChange={setAppearanceOpen}
      />
    </AppScreen>
  )
}

function PalaceSettingsForm({
  palace,
  onExit,
  appearanceOpen,
  onAppearanceOpenChange,
}: {
  palace: Palace
  onExit?: () => void
  appearanceOpen: boolean
  onAppearanceOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const rooms = useRoomStore(selectRooms)
  const loci = useLocusStore(selectLoci)
  const questions = useQuestionStore(selectQuestions)

  const [resetOpen, setResetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const download = (file: { filename: string; text: string; type: string }, message: string) => {
    downloadText(file.filename, file.text, file.type)
    toast.success(message)
  }

  return (
    <div className="mt-4 flex flex-col gap-6 pb-28">
      {/* Identity — tap the cover (or the header pencil) to edit name, icon, colour & photo. */}
      <button
        type="button"
        onClick={() => onAppearanceOpenChange(true)}
        aria-label={t('palaceSettings.editAppearance')}
        className="flex items-center gap-3.5 rounded-card bg-card p-4 text-left shadow-rest transition-transform active:scale-[0.99]"
      >
        <PalaceCover
          icon={palace.icon}
          color={palace.color}
          image={palace.image}
          className="size-16 shrink-0 rounded-card shadow-rest"
          iconClassName="text-3xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[length:var(--p-text-title)] font-bold tracking-tight text-heading">
            {palace.name}
          </p>
          <p className="mt-0.5 text-[length:var(--p-text-label)] text-muted-foreground">
            {t('palaceSettings.editAppearanceHint')}
          </p>
        </div>
        <Pencil className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {/* Manage */}
      <SettingsSection title={t('palaceSettings.manage')}>
        <SettingsRow
          kind="nav"
          icon={<Copy />}
          label={t('palaceSettings.duplicate')}
          description={t('palaceSettings.duplicateHint')}
          onClick={() => {
            void duplicatePalace(palaceStore, palace.id)
            toast.success(t('palaceSettings.toast.duplicated'))
          }}
        />
        <SettingsRow
          kind="nav"
          icon={<Download />}
          label={t('palaceSettings.export')}
          description={t('palaceSettings.exportHint')}
          onClick={() => setExportOpen(true)}
        />
        <SettingsRow
          kind="nav"
          icon={<RotateCcw />}
          label={t('palaceSettings.resetProgress')}
          description={t('palaceSettings.resetProgressHint')}
          onClick={() => setResetOpen(true)}
        />
        <SettingsRow
          kind="nav"
          icon={palace.archived ? <ArchiveRestore /> : <Archive />}
          label={palace.archived ? t('palaceSettings.unarchive') : t('palaceSettings.archive')}
          description={t('palaceSettings.archiveHint')}
          onClick={() => {
            void setPalaceArchived(palaceStore, palace.id, !palace.archived)
            toast.success(
              palace.archived
                ? t('palaceSettings.toast.unarchived')
                : t('palaceSettings.toast.archived'),
            )
          }}
        />
      </SettingsSection>

      {/* Delete */}
      <SettingsSection>
        <SettingsRow
          kind="nav"
          tone="danger"
          icon={<Trash2 />}
          label={t('palaceSettings.delete')}
          description={t('palaceSettings.deleteHint')}
          onClick={() => setDeleteOpen(true)}
        />
      </SettingsSection>

      <ActionSheet
        open={exportOpen}
        onOpenChange={setExportOpen}
        title={t('palaceSettings.exportSheetTitle')}
        description={t('palaceSettings.exportSheetDescription')}
        actions={[
          {
            id: 'json',
            label: t('palaceSettings.exportJson'),
            icon: <Download className="size-5" aria-hidden />,
            onSelect: () =>
              download(
                exportPalaceJson(palace, rooms, loci, questions),
                t('palaceSettings.toast.exported'),
              ),
          },
          {
            id: 'anki',
            label: t('palaceSettings.exportAnki'),
            icon: <FileText className="size-5" aria-hidden />,
            onSelect: () =>
              download(exportPalaceAnki(palace, rooms, loci), t('palaceSettings.toast.exported')),
          },
        ]}
        cancelLabel={t('common.cancel')}
      />

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        icon={<RotateCcw className="size-6" aria-hidden />}
        title={t('palaceSettings.resetConfirm.title')}
        description={t('palaceSettings.resetConfirm.body')}
        confirmLabel={t('palaceSettings.resetConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          void resetPalaceSrs(roomStore, locusStore, palace.id)
          toast.success(t('palaceSettings.toast.reset'))
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('palaceSettings.deleteConfirm.title', { name: palace.name })}
        description={t('palaceSettings.deleteConfirm.body')}
        confirmLabel={t('palaceSettings.deleteConfirm.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          void deletePalace(palaceStore, palace.id)
          toast.success(t('palaceSettings.toast.deleted'))
          onExit?.()
        }}
      />

      <PalaceAppearanceSheet
        open={appearanceOpen}
        onOpenChange={onAppearanceOpenChange}
        palace={palace}
      />
    </div>
  )
}
