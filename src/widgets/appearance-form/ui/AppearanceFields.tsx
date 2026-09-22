import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { DECK_COLOR_OPTIONS } from '@/entities/deck'
import { NAME_MAX } from '@/shared/config/constants'
import { IconColorRow, Input } from '@/shared/ui'

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
  /**
   * The name a new one takes if the field is left empty. It is the placeholder, not text in the
   * field — see `PromptSheet`'s `suggestion` for why nothing is pre-filled for the learner to select.
   */
  suggestion?: string
}

export function AppearanceFields({
  subject,
  name,
  color,
  icon,
  onNameChange,
  onColorChange,
  onIconChange,
  nameRef,
  suggestion,
}: AppearanceFieldsProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-5">
      <Input
        ref={nameRef}
        aria-label={t(`${subject}.nameLabel`)}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder={suggestion || t(`${subject}.namePlaceholder`)}
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
