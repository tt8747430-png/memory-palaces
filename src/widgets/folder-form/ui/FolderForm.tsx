import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { DECK_COLOR_OPTIONS } from '@/entities/deck'
import { useAutoSelect } from '@/shared/lib'
import { IconColorRow, Input } from '@/shared/ui'

export interface FolderFormProps {
  name: string
  color: string
  icon: string
  onNameChange: (value: string) => void
  onColorChange: (value: string) => void
  onIconChange: (value: string) => void
  /**
   * Ref to the name field so the hosting Sheet can focus it through Base UI's `initialFocus`
   * (scroll-safe, keyboard-aware). Prefer this over the native `autofocus` attribute, which
   * fires before the drawer is positioned and scrolls the whole page to reveal the field.
   */
  nameRef?: RefObject<HTMLInputElement | null>
  /** Fresh create: select the suggested name on first focus so typing replaces it. */
  autoFocusName?: boolean
}

export function FolderForm({
  name,
  color,
  icon,
  onNameChange,
  onColorChange,
  onIconChange,
  nameRef,
  autoFocusName = false,
}: FolderFormProps) {
  const { t } = useTranslation()
  const autoSelect = useAutoSelect<HTMLInputElement>(autoFocusName)
  return (
    <div className="flex flex-col gap-5">
      <Input
        ref={nameRef}
        aria-label={t('folder.nameLabel')}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        onFocus={autoSelect}
        placeholder={t('folder.namePlaceholder')}
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
