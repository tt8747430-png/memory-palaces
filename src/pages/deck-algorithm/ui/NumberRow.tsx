import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PromptSheet, SettingsRow } from '@/shared/ui'

export interface NumberRowProps {
  icon: ReactNode
  label: string
  value: number
  onChange: (value: number) => void
}

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
        suggestion={String(value)}
        confirmLabel={t('deckSettings.appearanceSave')}
        onSubmit={(next) => {
          const parsed = Number.parseInt(next, 10)
          if (Number.isNaN(parsed) || parsed < 0) {
            toast.error(t('algorithm.invalidNumber'))
            return
          }
          onChange(parsed)
        }}
      />
    </>
  )
}
