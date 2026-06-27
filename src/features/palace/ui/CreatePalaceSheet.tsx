import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { DEFAULT_PALACE_COLOR, DEFAULT_PALACE_ICON, usePalaceStoreApi } from '@/entities/palace'
import { Button, Sheet } from '@/shared/ui'
import { createPalace } from '../create-palace'
import { PalaceIdentityFields } from '@/features/palace'

export interface CreatePalaceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The new palace's id + name, so the caller can confirm it (toast) or navigate into it. */
  onCreated: (palaceId: string, name: string) => void
  /** File the new palace into this folder; null/undefined creates it at the library root. */
  folderId?: string | null
}

/**
 * Create a palace in one pass — name, a tap-for-any-emoji icon, a colour, and an optional
 * cover photo, over a live preview of the card you're making. A keyboard-aware bottom sheet,
 * never a full-screen drawer (phone-first). The create command is the shared write-path, so
 * the AI Tutor can open the same flow.
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
  const [image, setImage] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  // Fresh state every time the sheet opens.
  useEffect(() => {
    if (!open) return
    setName('')
    setIcon(DEFAULT_PALACE_ICON)
    setColor(DEFAULT_PALACE_COLOR)
    setImage(undefined)
    setSubmitting(false)
  }, [open])

  const valid = name.trim().length >= 2

  const handleCreate = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true)
    try {
      const palace = await createPalace(store, {
        name: name.trim(),
        icon,
        color,
        image,
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
      <form onSubmit={(event) => void handleCreate(event)} className="pb-1">
        <PalaceIdentityFields
          name={name}
          icon={icon}
          color={color}
          image={image}
          onNameChange={setName}
          onIconChange={setIcon}
          onColorChange={setColor}
          onImageChange={setImage}
          autoFocusName
        />
        <p className="mt-4 text-center text-[length:var(--p-text-label)] text-muted-foreground">
          {t('palaces.createHint')}
        </p>
      </form>
    </Sheet>
  )
}
