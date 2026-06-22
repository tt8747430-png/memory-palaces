import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Folder as FolderIcon, FolderPlus, Sparkles, Trash2 } from 'lucide-react'
import type { Folder } from '@/entities/folder'
import { ColorPicker } from '@/features/palace'
import { cn } from '@/shared/lib'
import { Button, Sheet, TextField } from '@/shared/ui'

export interface MoveToFolderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  palaceName: string
  currentFolderId: string | null
  folders: Folder[]
  onPick: (folderId: string | null) => void
  onNewFolder: () => void
}

/** Bottom sheet for filing a palace into a folder (or unfiling it). The trailing action
 * jumps to creating a new folder. */
export function MoveToFolderSheet({
  open,
  onOpenChange,
  palaceName,
  currentFolderId,
  folders,
  onPick,
  onNewFolder,
}: MoveToFolderSheetProps) {
  const { t } = useTranslation()
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('palaces.moveTitle')}
      description={palaceName}
      footer={
        <Button variant="secondary" size="lg" className="w-full" onClick={onNewFolder}>
          <FolderPlus className="size-[18px]" aria-hidden />
          {t('palaces.moveNewFolder')}
        </Button>
      }
    >
      <div className="flex flex-col gap-1.5 pb-2">
        <FolderOption
          label={t('palaces.moveNone')}
          icon={<Sparkles className="size-4" aria-hidden />}
          selected={currentFolderId === null}
          onClick={() => onPick(null)}
        />
        {folders.map((folder) => (
          <FolderOption
            key={folder.id}
            label={folder.name}
            icon={<FolderIcon className="size-4" aria-hidden />}
            selected={currentFolderId === folder.id}
            onClick={() => onPick(folder.id)}
          />
        ))}
      </div>
    </Sheet>
  )
}

function FolderOption({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-3 rounded-card px-4 py-3 text-left transition-colors',
        selected ? 'bg-primary text-primary-foreground' : 'bg-info-surface text-heading',
      )}
    >
      <span className={selected ? 'opacity-90' : 'text-accent'}>{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[length:var(--p-text-body)] font-medium">
        {label}
      </span>
      {selected ? <Check className="size-4 shrink-0" aria-hidden /> : null}
    </button>
  )
}

export interface NewFolderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => void
}

/** Bottom sheet to name a new folder. Colour + icon are assigned automatically, so it's
 * a single field — folders are lightweight groupings. */
export function NewFolderSheet({ open, onOpenChange, onCreate }: NewFolderSheetProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName('')
  }, [open])

  const valid = name.trim().length > 0
  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!valid) return
    onCreate(name.trim())
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('palaces.newFolderTitle')}
      footer={
        <Button size="lg" className="w-full" disabled={!valid} onClick={() => submit()}>
          <FolderPlus className="size-[18px]" aria-hidden />
          {t('palaces.createFolder')}
        </Button>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-2 pb-2">
        <p className="text-[length:var(--p-text-label)]">{t('palaces.folderNameHint')}</p>
        <TextField
          aria-label={t('palaces.folderNameLabel')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('palaces.folderNamePlaceholder')}
          autoFocus
          enterKeyHint="done"
          maxLength={40}
        />
      </form>
    </Sheet>
  )
}

export interface EditFolderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The folder being edited; the fields seed from it whenever the sheet opens. */
  folder: Folder | null
  onSave: (changes: { name: string; color: string }) => void
  /** Hands off to the page's delete-folder confirm — the forgiving exit. */
  onDelete: () => void
}

/** Bottom sheet to rename and recolour a folder, with a clearly-separated delete. Folders
 * are lightweight, so editing is a name field plus the shared colour picker; deletion is
 * gated by the page's confirm dialog (palaces inside stay safe). */
export function EditFolderSheet({ open, onOpenChange, folder, onSave, onDelete }: EditFolderSheetProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [color, setColor] = useState('')

  useEffect(() => {
    if (open && folder) {
      setName(folder.name)
      setColor(folder.color)
    }
  }, [open, folder])

  const valid = name.trim().length > 0
  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!valid) return
    onSave({ name: name.trim(), color })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('palaces.editFolderTitle')}
      footer={
        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full" disabled={!valid} onClick={() => submit()}>
            <Check className="size-[18px]" aria-hidden />
            {t('palaces.saveFolder')}
          </Button>
          <Button variant="destructive" size="lg" className="w-full" onClick={onDelete}>
            <Trash2 className="size-[18px]" aria-hidden />
            {t('palaces.confirmDeleteFolder')}
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4 pb-2">
        <TextField
          aria-label={t('palaces.folderNameLabel')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('palaces.folderNamePlaceholder')}
          autoFocus
          enterKeyHint="done"
          maxLength={40}
        />
        <ColorPicker
          value={color}
          onChange={setColor}
          label={t('palaces.folderColorLabel')}
          customLabel={t('palaces.customColor')}
        />
      </form>
    </Sheet>
  )
}
