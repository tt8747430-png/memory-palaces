import { type SyntheticEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, FolderPlus } from 'lucide-react'
import { DEFAULT_FOLDER_ICON, type Folder } from '@/entities/folder'
import { FolderForm } from '@/widgets/folder-form'
import { Button, Sheet } from '@/shared/ui'

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
 * folder lives in its row menu, not here.) */
export function FolderSheet({ open, onOpenChange, folder, defaultColor, onSubmit }: FolderSheetProps) {
  const { t } = useTranslation()
  const isEdit = folder != null
  const [name, setName] = useState('')
  const [color, setColor] = useState(defaultColor)
  const [icon, setIcon] = useState(DEFAULT_FOLDER_ICON)

  // Seed each time the sheet opens: from the folder when editing, fresh defaults when creating.
  useEffect(() => {
    if (!open) return
    setName(folder?.name ?? '')
    setColor(folder?.color || defaultColor)
    setIcon(folder?.icon || DEFAULT_FOLDER_ICON)
  }, [open, folder, defaultColor])

  const valid = name.trim().length > 0
  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault()
    if (!valid) return
    onSubmit({ name: name.trim(), color, icon })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('folder.settingsTitle') : t('folder.newTitle')}
      footer={
        <Button size="lg" className="w-full" disabled={!valid} onClick={() => submit()}>
          {isEdit ? (
            <Check className="size-[18px]" aria-hidden />
          ) : (
            <FolderPlus className="size-[18px]" aria-hidden />
          )}
          {isEdit ? t('folder.save') : t('folder.create')}
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
