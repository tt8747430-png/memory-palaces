import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import {
  DEFAULT_FOLDER_ICON,
  selectIsReady,
  useFolderStore,
  useFolderStoreApi,
  type Folder,
} from '@/entities/folder'
import { usePalaceStoreApi } from '@/entities/palace'
import { deleteFolder, editFolder } from '@/features/folder'
import { FolderForm } from '@/widgets/folder-form'
import { AppScreen, Button, ConfirmDialog, ScreenHeader } from '@/shared/ui'

export interface FolderEditPageProps {
  folderId: string
  onBack?: () => void
  /** Leave the (now-removed) folder after a delete — typically back to the library root. */
  onDeleted?: () => void
}

/** Edit a single folder on its own page — rename, recolour, re-icon, or delete. Split out of
 * the library so editing is a focused, undo-safe surface (deleting a folder keeps its palaces;
 * they move back to the root). Reactive off the folder store; the change persists on Save. */
export function FolderEditPage({ folderId, onBack, onDeleted }: FolderEditPageProps) {
  const { t } = useTranslation()
  const folderStore = useFolderStoreApi()
  const palaceStore = usePalaceStoreApi()

  useEffect(() => {
    folderStore.getState().start()
    palaceStore.getState().start()
  }, [folderStore, palaceStore])

  const folder = useFolderStore((state) => state.folders.find((candidate) => candidate.id === folderId))
  const ready = useFolderStore(selectIsReady)

  if (!ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  if (!folder) {
    return (
      <AppScreen
        header={
          <ScreenHeader
            title={t('palaces.folderNotFound')}
            onBack={onBack}
            backLabel={t('common.back')}
          />
        }
      />
    )
  }

  return <FolderEditForm key={folder.id} folder={folder} onBack={onBack} onDeleted={onDeleted} />
}

function FolderEditForm({
  folder,
  onBack,
  onDeleted,
}: {
  folder: Folder
  onBack?: () => void
  onDeleted?: () => void
}) {
  const { t } = useTranslation()
  const folderStore = useFolderStoreApi()
  const palaceStore = usePalaceStoreApi()
  const [name, setName] = useState(folder.name)
  const [color, setColor] = useState(folder.color)
  const [icon, setIcon] = useState(folder.icon || DEFAULT_FOLDER_ICON)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const valid = name.trim().length > 0
  const save = () => {
    if (!valid) return
    void editFolder(folderStore, folder, { name: name.trim(), color, icon })
    onBack?.()
  }
  const remove = () => {
    void deleteFolder(folderStore, palaceStore, folder.id)
    setConfirmDelete(false)
    onDeleted?.()
  }

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader
          title={t('palaces.editFolderTitle')}
          subtitle={folder.name}
          onBack={onBack}
          backLabel={t('common.back')}
          action={
            <Button size="sm" disabled={!valid} onClick={save}>
              {t('palaces.saveFolder')}
            </Button>
          }
        />
      }
    >
      <div className="mt-4 flex flex-col gap-6 pb-28">
        <FolderForm
          name={name}
          color={color}
          icon={icon}
          onNameChange={setName}
          onColorChange={setColor}
          onIconChange={setIcon}
        />

        <Button
          variant="destructive"
          size="lg"
          className="w-full"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="size-[18px]" aria-hidden />
          {t('palaces.confirmDeleteFolder')}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        icon={<Trash2 className="size-7" aria-hidden />}
        title={t('palaces.deleteFolderTitle', { name: folder.name })}
        description={t('palaces.deleteFolderBody')}
        confirmLabel={t('palaces.confirmDeleteFolder')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={remove}
      />
    </AppScreen>
  )
}
