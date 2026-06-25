import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { DEFAULT_PALACE_COLOR, DEFAULT_PALACE_ICON, usePalaceStoreApi } from '@/entities/palace'
import { Button, PalaceCover, Sheet, TextField } from '@/shared/ui'
import { createPalace } from '../create-palace'
import { ColorPicker, IconPicker } from './appearance-pickers'

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
        category: 'General',
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
        {/* Live preview + name */}
        <div className="flex items-center gap-3.5">
          <PalaceCover
            icon={icon}
            color={color}
            className="size-16 shrink-0 rounded-card shadow-rest"
            iconClassName="text-3xl"
          />
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-[length:var(--p-text-label)] font-semibold text-heading">
              {t('palaces.createName')}
            </span>
            <TextField
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
          </label>
        </div>

        <IconPicker value={icon} onChange={setIcon} label={t('palaces.iconLabel')} />
        <ColorPicker
          value={color}
          onChange={setColor}
          label={t('palaces.colorLabel')}
          customLabel={t('palaces.customColor')}
        />

        <p className="text-center text-[length:var(--p-text-label)]">{t('palaces.createHint')}</p>
      </div>
    </Sheet>
  )
}
