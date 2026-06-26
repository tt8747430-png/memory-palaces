import { useTranslation } from 'react-i18next'
import { IconColorRow } from '@/features/palace'
import { TextField } from '@/shared/ui'

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
 * caller owns the values and persistence, so the create sheet and the edit drawer share one
 * form. The icon comes from the device keyboard, the colour from a small brand palette. */
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
        aria-label={t('palaces.folderNameLabel')}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder={t('palaces.folderNamePlaceholder')}
        autoFocus={autoFocusName}
        enterKeyHint="done"
        maxLength={40}
      />
      <IconColorRow
        icon={icon}
        color={color}
        onIconChange={onIconChange}
        onColorChange={onColorChange}
        label={t('palaces.iconColorLabel')}
        iconLabel={t('palaces.folderIconLabel')}
      />
    </div>
  )
}
