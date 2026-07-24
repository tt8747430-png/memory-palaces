import { type SyntheticEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, FolderPlus } from 'lucide-react'
import { DEFAULT_FOLDER_ICON, type Folder } from '@/entities/folder'
import { FolderForm } from '@/widgets/folder-form'
import { Button, Sheet } from '@/shared/ui'

export interface FolderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder?: Folder | null
  defaultColor: string
  defaultName?: string
  onSubmit: (changes: { name: string; color: string; icon: string }) => void
}

export function FolderSheet({
  open,
  onOpenChange,
  folder,
  defaultColor,
  defaultName = '',
  onSubmit,
}: FolderSheetProps) {
  const { t } = useTranslation()
  const isEdit = folder != null
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(defaultColor)
  const [icon, setIcon] = useState(DEFAULT_FOLDER_ICON)

  useEffect(() => {
    if (!open) return
    setName(folder?.name ?? defaultName)
    setColor(folder?.color || defaultColor)
    setIcon(folder?.icon || DEFAULT_FOLDER_ICON)
  }, [open, folder, defaultColor, defaultName])

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
      // Focus the name field through Base UI (scroll-safe) on create only; editing opens without
      // grabbing focus so changing just the colour/icon doesn't raise the keyboard.
      initialFocus={isEdit ? undefined : nameRef}
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
          nameRef={nameRef}
          autoFocusName={!isEdit}
        />
      </form>
    </Sheet>
  )
}
