import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PromptSheet, SettingsRow } from '@/shared/ui'

export interface NumberRowProps {
  icon: ReactNode
  label: string
  value: number
  onChange: (value: number) => void
}

/**
 * A whole-number settings row. The value reads on the row, and tapping it opens the prompt sheet
 * the rest of the app uses for short entry — a number pad on the page would fight the keyboard
 * rules in CODE_STYLE §11 for no gain. Anything unparseable is simply not saved.
 */
export function NumberRow({ icon, label, value, onChange }: NumberRowProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <SettingsRow
        kind="nav"
        icon={icon}
        label={label}
        value={String(value)}
        onClick={() => setOpen(true)}
      />
      <PromptSheet
        open={open}
        onOpenChange={setOpen}
        title={label}
        fieldLabel={label}
        initialValue={String(value)}
        confirmLabel={t('deckSettings.appearanceSave')}
        onSubmit={(next) => {
          const parsed = Number.parseInt(next, 10)
          if (Number.isNaN(parsed) || parsed < 0) return
          onChange(parsed)
        }}
      />
    </>
  )
}
