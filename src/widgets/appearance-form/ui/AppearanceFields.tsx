import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { DECK_COLOR_OPTIONS } from '@/entities/deck'
import { NAME_MAX } from '@/shared/config/constants'
import { useAutoSelect } from '@/shared/lib'
import { IconColorRow, Input } from '@/shared/ui'

/** Which thing is being dressed — it only picks the wording. */
export type AppearanceSubject = 'deck' | 'folder'

export interface AppearanceFieldsProps {
  subject: AppearanceSubject
  name: string
  color: string
  icon: string
  onNameChange: (value: string) => void
  onColorChange: (value: string) => void
  onIconChange: (value: string) => void
  nameRef?: RefObject<HTMLInputElement | null>
  autoFocusName?: boolean
}

/**
 * The one name-icon-colour form. Decks and folders are dressed the same way and take the same name
 * length, so `subject` settles nothing but the wording of the labels.
 */
export function AppearanceFields({
  subject,
  name,
  color,
  icon,
  onNameChange,
  onColorChange,
  onIconChange,
  nameRef,
  autoFocusName = false,
}: AppearanceFieldsProps) {
  const { t } = useTranslation()
  const autoSelect = useAutoSelect<HTMLInputElement>(autoFocusName)
  return (
    <div className="flex flex-col gap-5">
      <Input
        ref={nameRef}
        aria-label={t(`${subject}.nameLabel`)}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        onFocus={autoSelect}
        placeholder={t(`${subject}.namePlaceholder`)}
        enterKeyHint="done"
        maxLength={NAME_MAX}
      />
      <IconColorRow
        icon={icon}
        color={color}
        onIconChange={onIconChange}
        onColorChange={onColorChange}
        colorOptions={DECK_COLOR_OPTIONS}
        label={t('folder.iconColorLabel')}
        iconLabel={t(`${subject}.iconLabel`)}
      />
    </div>
  )
}
