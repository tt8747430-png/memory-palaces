import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Archive,
  ArchiveRestore,
  Copy,
  Download,
  FileText,
  ImagePlus,
  RotateCcw,
  Tag,
  Trash2,
} from 'lucide-react'
import {
  ColorPicker,
  IconPicker,
  deletePalace,
  duplicatePalace,
  editPalace,
  exportPalaceAnki,
  exportPalaceJson,
  setPalaceArchived,
} from '@/features/palace'
import { resetPalaceSrs } from '@/features/locus'
import {
  selectIsReady as selectPalacesReady,
  usePalaceStore,
  usePalaceStoreApi,
  type Palace,
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
import { downloadText, fileToAvatar } from '@/shared/lib'
import {
  AppScreen,
  Button,
  ConfirmDialog,
  PalaceCover,
  ScreenHeader,
  SettingsRow,
  SettingsSection,
  Textarea,
  TextField,
} from '@/shared/ui'

export interface PalaceSettingsPageProps {
  palaceId: string
  onBack?: () => void
  /** Navigate away once the palace is deleted. */
  onExit?: () => void
}

/** Per-palace settings — identity, appearance, type, study behaviour, manage (duplicate /
 * export / reset / archive), and delete. Every change persists through the palace command
 * layer; study toggles read straight off the reactive palace, so they can't drift. */
export function PalaceSettingsPage({ palaceId, onBack, onExit }: PalaceSettingsPageProps) {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const questionStore = useQuestionStoreApi()

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
      <PalaceSettingsForm palace={palace} onExit={onExit} />
    </AppScreen>
  )
}

function PalaceSettingsForm({ palace, onExit }: { palace: Palace; onExit?: () => void }) {
  const { t } = useTranslation()
  const palaceStore = usePalaceStoreApi()
  const roomStore = useRoomStoreApi()
  const locusStore = useLocusStoreApi()
  const rooms = useRoomStore(selectRooms)
  const loci = useLocusStore(selectLoci)
  const questions = useQuestionStore(selectQuestions)

  const [name, setName] = useState(palace.name)
  const [description, setDescription] = useState(palace.description)
  const [category, setCategory] = useState(palace.category)
  const [resetOpen, setResetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Reseed the local text fields if the underlying palace identity changes.
  useEffect(() => {
    setName(palace.name)
    setDescription(palace.description)
    setCategory(palace.category)
  }, [palace.id, palace.name, palace.description, palace.category])

  const patch = (changes: Parameters<typeof editPalace>[2]) =>
    void editPalace(palaceStore, palace.id, changes)

  const commitName = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setName(palace.name)
      return
    }
    if (trimmed !== palace.name) patch({ name: trimmed })
  }

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) patch({ image: await fileToAvatar(file) })
    event.target.value = ''
  }

  const download = (file: { filename: string; text: string; type: string }, message: string) => {
    downloadText(file.filename, file.text, file.type)
    toast.success(message)
  }

  return (
    <div className="mt-4 flex flex-col gap-6 pb-28">
      {/* Identity */}
      <SettingsSection title={t('palaceSettings.identity')}>
        <div className="flex items-center gap-3.5 p-4">
          <PalaceCover
            icon={palace.icon}
            color={palace.color}
            image={palace.image}
            className="size-16 shrink-0 rounded-card shadow-rest"
            iconClassName="text-3xl"
          />
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-[length:var(--p-text-label)] font-semibold text-heading">
              {t('palaceSettings.nameLabel')}
            </span>
            <TextField
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={commitName}
              maxLength={60}
              enterKeyHint="done"
            />
          </label>
        </div>
        <label className="block p-4">
          <span className="mb-1.5 block text-[length:var(--p-text-label)] font-semibold text-heading">
            {t('palaceSettings.descriptionLabel')}
          </span>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={() =>
              description.trim() !== palace.description &&
              patch({ description: description.trim() })
            }
            placeholder={t('palaceSettings.descriptionPlaceholder')}
            rows={3}
            maxLength={200}
          />
        </label>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title={t('palaceSettings.appearance')}>
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[length:var(--p-text-sub)] font-semibold text-heading">
                {t('palaceSettings.coverPhoto')}
              </p>
              <p className="text-[length:var(--p-text-label)] text-muted-foreground">
                {t('palaceSettings.coverPhotoHint')}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {palace.image ? (
                <Button size="sm" variant="ghost" onClick={() => patch({ image: undefined })}>
                  {t('palaceSettings.removePhoto')}
                </Button>
              ) : null}
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="size-[18px]" aria-hidden />
                {palace.image ? t('palaceSettings.replacePhoto') : t('palaceSettings.addPhoto')}
              </Button>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhoto}
          />
          <IconPicker
            value={palace.icon}
            onChange={(icon) => patch({ icon })}
            label={t('palaceSettings.iconLabel')}
          />
          <ColorPicker
            value={palace.color}
            onChange={(color) => patch({ color })}
            label={t('palaceSettings.colorLabel')}
            customLabel={t('palaceSettings.customColor')}
          />
        </div>
      </SettingsSection>

      {/* Category */}
      <SettingsSection title={t('palaceSettings.type')}>
        <label className="flex items-center gap-3 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-info-surface text-info-foreground">
            <Tag className="size-[18px]" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
              {t('palaceSettings.category')}
            </span>
            <TextField
              className="mt-1.5"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              onBlur={() =>
                category.trim() !== palace.category && patch({ category: category.trim() })
              }
              placeholder={t('palaceSettings.categoryPlaceholder')}
              maxLength={40}
            />
          </span>
        </label>
      </SettingsSection>

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
          onClick={() =>
            download(
              exportPalaceJson(palace, rooms, loci, questions),
              'palaceSettings.toast.exported',
            )
          }
        />
        <SettingsRow
          kind="nav"
          icon={<FileText />}
          label={t('palaceSettings.exportAnki')}
          description={t('palaceSettings.exportAnkiHint')}
          onClick={() =>
            download(exportPalaceAnki(palace, rooms, loci), 'palaceSettings.toast.exported')
          }
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
    </div>
  )
}
