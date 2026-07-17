import { useTranslation } from 'react-i18next'
import { DECK_COLOR_OPTIONS } from '@/decks'
import { useAutoSelect } from '@/shared/lib'
import { IconColorRow, TextField } from '@/shared/ui'

export interface FolderFormProps {
  name: string
  color: string
  icon: string
  onNameChange: (value: string) => void
  onColorChange: (value: string) => void
  onIconChange: (value: string) => void
  autoFocusName?: boolean
}

/** Controlled icon/color/name editor body, reused by the folder drawer and settings. */
export function FolderForm({
  name,
  color,
  icon,
  onNameChange,
  onColorChange,
  onIconChange,
  autoFocusName = false,
}: FolderFormProps) {
  const { t } = useTranslation()
  const autoSelect = useAutoSelect<HTMLInputElement>(autoFocusName)
  return (
    <div className="flex flex-col gap-5">
      <TextField
        aria-label={t('folder.nameLabel')}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        onFocus={autoSelect}
        placeholder={t('folder.namePlaceholder')}
        autoFocus={autoFocusName}
        enterKeyHint="done"
        maxLength={40}
      />
      <IconColorRow
        icon={icon}
        color={color}
        onIconChange={onIconChange}
        onColorChange={onColorChange}
        colorOptions={DECK_COLOR_OPTIONS}
        label={t('folder.iconColorLabel')}
        iconLabel={t('folder.iconLabel')}
      />
    </div>
  )
}
