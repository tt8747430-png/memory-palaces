import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { DEFAULT_PALACE_COLOR, DEFAULT_PALACE_ICON, usePalaceStoreApi } from '@/entities/palace'
import { Button, Sheet, TextField } from '@/shared/ui'
import { createPalace } from '../create-palace'
import { IconColorRow } from './appearance-pickers'

export interface CreatePalaceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The new palace's id + name, so the caller can confirm it (toast) or navigate into it. */
  onCreated: (palaceId: string, name: string) => void
  /** File the new palace into this folder; null/undefined creates it at the library root. */
  folderId?: string | null
}

/**
 * Minimal create — a name, a quick icon and colour, with a live cover preview. Everything
 * else (description, category, cover photo) is set later in palace settings, so making a
 * palace is a couple of taps. A keyboard-aware bottom sheet, never a full-screen drawer
 * (this is a phone-first app). The create command is the shared write-path, so the AI Tutor
 * can open the same flow.
 */
export function CreatePalaceSheet({
  open,
  onOpenChange,
  onCreated,
  folderId,
}: CreatePalaceSheetProps) {
  const { t } = useTranslation()
  const store = usePalaceStoreApi()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(DEFAULT_PALACE_ICON)
  const [color, setColor] = useState(DEFAULT_PALACE_COLOR)
  const [submitting, setSubmitting] = useState(false)

  // Fresh state every time the sheet opens.
  useEffect(() => {
    if (!open) return
    setName('')
    setIcon(DEFAULT_PALACE_ICON)
    setColor(DEFAULT_PALACE_COLOR)
    setSubmitting(false)
  }, [open])

  const valid = name.trim().length >= 2

  const handleCreate = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    try {
      const palace = await createPalace(store, {
        name: name.trim(),
        icon,
        color,
        folderId: folderId ?? null,
      })
      onOpenChange(false)
      onCreated(palace.id, palace.name)
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('palaces.createTitle')}
      footer={
        <Button
          size="lg"
          className="w-full"
          disabled={!valid || submitting}
          onClick={() => void handleCreate()}
        >
          <Sparkles className="size-[18px]" aria-hidden />
          {t('palaces.createCta')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <TextField
          aria-label={t('palaces.createName')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void handleCreate()
          }}
          placeholder={t('palaces.createNamePlaceholder')}
          autoFocus
          enterKeyHint="done"
          maxLength={60}
        />

        <IconColorRow
          icon={icon}
          color={color}
          onIconChange={setIcon}
          onColorChange={setColor}
          label={t('palaces.iconColorLabel')}
          iconLabel={t('palaces.iconLabel')}
        />

        <p className="text-center text-[length:var(--p-text-label)]">{t('palaces.createHint')}</p>
      </div>
    </Sheet>
  )
}
