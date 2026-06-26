import { useTranslation } from 'react-i18next'
import { FOLDER_ICON_OPTIONS } from '@/entities/folder'
import { ColorPicker, IconPicker } from '@/features/palace'
import { FolderGlyph, TextField } from '@/shared/ui'

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

/** The folder identity fields — a live glyph preview over a name field, emoji picker, and
 * the shared colour picker. Stateless: the caller owns the values and persistence, so the
 * quick "create" sheet and the full "edit" page share one form without duplicating it. */
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
      <div className="flex items-center gap-3 rounded-card bg-info-surface p-3">
        <FolderGlyph color={color} icon={icon} className="size-12 shrink-0" iconClassName="text-2xl leading-none" />
        <div className="min-w-0">
          <p className="truncate text-[length:var(--p-text-sub)] font-semibold text-heading">
            {name.trim() || t('palaces.folderNamePlaceholder')}
          </p>
          <p className="text-[length:var(--p-text-label)] text-muted-foreground">
            {t('palaces.folderNameHint')}
          </p>
        </div>
      </div>

      <TextField
        aria-label={t('palaces.folderNameLabel')}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder={t('palaces.folderNamePlaceholder')}
        autoFocus={autoFocusName}
        enterKeyHint="done"
        maxLength={40}
      />

      <IconPicker
        value={icon}
        onChange={onIconChange}
        label={t('palaces.folderIconLabel')}
        options={FOLDER_ICON_OPTIONS}
      />

      <ColorPicker
        value={color}
        onChange={onColorChange}
        label={t('palaces.folderColorLabel')}
        customLabel={t('palaces.customColor')}
      />
    </div>
  )
}
