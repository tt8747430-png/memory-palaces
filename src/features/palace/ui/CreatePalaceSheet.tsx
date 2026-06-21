import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Sparkles } from 'lucide-react'
import { DEFAULT_PALACE_COLOR, DEFAULT_PALACE_ICON, usePalaceStoreApi } from '@/entities/palace'
import { cn } from '@/shared/lib'
import { Button, PalaceCover, Sheet, SwitchTrack, TextField } from '@/shared/ui'
import { createPalace } from '../create-palace'
import { ColorPicker, IconPicker } from './appearance-pickers'

export interface CreatePalaceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The new palace's id, so the caller can navigate straight into it. */
  onCreated: (palaceId: string) => void
}

/**
 * Minimal create — a name, a quick icon and colour, and the Bible-mode choice, with a
 * live cover preview. Everything else (description, category, cover photo) is set later
 * in palace settings, so making a palace is a couple of taps. A keyboard-aware bottom
 * sheet, never a full-screen drawer (this is a phone-first app). The create command is
 * the shared write-path, so the AI Tutor can open the same flow.
 */
export function CreatePalaceSheet({ open, onOpenChange, onCreated }: CreatePalaceSheetProps) {
  const { t } = useTranslation()
  const store = usePalaceStoreApi()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(DEFAULT_PALACE_ICON)
  const [color, setColor] = useState(DEFAULT_PALACE_COLOR)
  const [bibleMode, setBibleMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fresh state every time the sheet opens.
  useEffect(() => {
    if (!open) return
    setName('')
    setIcon(DEFAULT_PALACE_ICON)
    setColor(DEFAULT_PALACE_COLOR)
    setBibleMode(false)
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
        bibleMode,
        category: bibleMode ? 'Scripture' : 'General',
      })
      onOpenChange(false)
      onCreated(palace.id)
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

        {/* Bible mode */}
        <button
          type="button"
          role="switch"
          aria-checked={bibleMode}
          aria-label={t('palaces.bibleMode')}
          onClick={() => setBibleMode((value) => !value)}
          className="flex w-full items-center gap-3.5 rounded-card bg-info-surface px-4 py-3 text-left transition-transform active:scale-[0.99]"
        >
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-control transition-colors',
              bibleMode ? 'bg-primary text-primary-foreground' : 'bg-card text-primary',
            )}
          >
            <BookOpen className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
              {t('palaces.bibleMode')}
            </span>
            <span className="mt-0.5 block text-[length:var(--p-text-label)] leading-snug">
              {t('palaces.bibleModeHint')}
            </span>
          </span>
          <SwitchTrack checked={bibleMode} />
        </button>

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
