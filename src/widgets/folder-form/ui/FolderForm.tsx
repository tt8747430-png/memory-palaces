import { useTranslation } from 'react-i18next'
import { DECK_COLOR_OPTIONS } from '@/entities/deck'
import { IconColorRow, TextField } from '@/shared/ui'

export interface FolderFormProps {
  name: string
  color: string
  icon: string
  onNameChange: (value: string) => void
  onColorChange: (value: string) => void
  onIconChange: (value: string) => void
  /** Autofocus the name field on mount (create flow only). */
  autoFocusName?: boolean
}

/** A folder's identity fields — name plus the shared icon-and-colour row. Stateless: the
 * caller owns the values and persistence, so the create sheet and the settings sheet share
 * one form. The icon comes from the device keyboard, the colour from the shared brand palette. */
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
  return (
    <div className="flex flex-col gap-5">
      <TextField
        aria-label={t('folder.nameLabel')}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
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
