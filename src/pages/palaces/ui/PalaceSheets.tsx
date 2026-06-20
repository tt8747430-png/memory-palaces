import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Folder as FolderIcon, FolderPlus, Sparkles } from 'lucide-react'
import type { Folder } from '@/entities/folder'
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
