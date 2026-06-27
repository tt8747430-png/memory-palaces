import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, FolderPlus, Sparkles } from 'lucide-react'
import { DEFAULT_FOLDER_ICON, type Folder } from '@/entities/folder'
import { FolderForm } from '@/widgets/folder-form'
import { cn } from '@/shared/lib'
import { Button, FolderGlyph, Sheet } from '@/shared/ui'
import * as React from 'react'

export interface MoveToFolderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  palaceName: string
  currentFolderId: string | null
  folders: Folder[]
  onPick: (folderId: string | null) => void
  onNewFolder: () => void
}

/** Bottom sheet for filing a palace into a folder (or moving it back to the library root).
 * Each folder shows its own colour-and-emoji glyph, so the choice matches its card in the
 * library. The footer jumps to creating a new folder. */
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
          glyph={
            <span className="grid size-9 shrink-0 place-items-center rounded-[7px] bg-info-surface text-accent">
              <Sparkles className="size-4" aria-hidden />
            </span>
          }
          selected={currentFolderId === null}
          onClick={() => onPick(null)}
        />
        {folders.map((folder) => (
          <FolderOption
            key={folder.id}
            label={folder.name}
            glyph={
              <FolderGlyph
                color={folder.color}
                icon={folder.icon}
                className="size-9"
                iconClassName="text-base leading-none"
              />
            }
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
  glyph,
  selected,
  onClick,
}: {
  label: string
  glyph: React.ReactNode
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-3 rounded-card px-3 py-2.5 text-left transition-colors',
        selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-info-surface text-heading active:bg-secondary/30',
      )}
    >
      {glyph}
      <span className="min-w-0 flex-1 truncate text-[length:var(--p-text-body)] font-medium">
        {label}
      </span>
      {selected ? <Check className="size-5 shrink-0" aria-hidden /> : null}
    </button>
  )
}

export interface FolderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The folder being edited; `null`/undefined puts the sheet in create mode. */
  folder?: Folder | null
  /** Seed colour for a brand-new folder (the page cycles the palette so folders differ). */
  defaultColor: string
  onSubmit: (changes: { name: string; color: string; icon: string }) => void
}

/** One bottom sheet for the whole folder lifecycle — create and "Folder settings" (edit).
 * Name, a tap-for-any-emoji icon, and a brand colour, so a folder gets a real identity in one
 * pass. Naming alone is enough on create — the emoji and colour come pre-chosen. (Deleting a
 * folder lives in its card menu, not here.) */
export function FolderSheet({
  open,
  onOpenChange,
  folder,
  defaultColor,
  onSubmit,
}: FolderSheetProps) {
  const { t } = useTranslation()
  const isEdit = folder != null
  const [name, setName] = useState('')
  const [color, setColor] = useState(defaultColor)
  const [icon, setIcon] = useState(DEFAULT_FOLDER_ICON)

  // Seed each time the sheet opens: from the folder when editing, fresh defaults when creating.
  useEffect(() => {
    if (!open) return
    setName(folder?.name ?? '')
    setColor(folder?.color ?? defaultColor)
    setIcon(folder?.icon ?? DEFAULT_FOLDER_ICON)
  }, [open, folder, defaultColor])

  const valid = name.trim().length > 0
  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!valid) return
    onSubmit({ name: name.trim(), color, icon })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('palaces.folderSettings') : t('palaces.newFolderTitle')}
      footer={
        <Button size="lg" className="w-full" disabled={!valid} onClick={() => submit()}>
          {isEdit ? (
            <Check className="size-[18px]" aria-hidden />
          ) : (
            <FolderPlus className="size-[18px]" aria-hidden />
          )}
          {isEdit ? t('palaces.saveFolder') : t('palaces.createFolder')}
        </Button>
      }
    >
      <form onSubmit={submit} className="pb-2">
        <FolderForm
          name={name}
          color={color}
          icon={icon}
          onNameChange={setName}
          onColorChange={setColor}
          onIconChange={setIcon}
          autoFocusName={!isEdit}
        />
      </form>
    </Sheet>
  )
}
