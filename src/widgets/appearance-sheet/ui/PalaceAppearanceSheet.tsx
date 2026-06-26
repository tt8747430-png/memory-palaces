import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ImagePlus } from 'lucide-react'
import { editPalace, IconColorRow } from '@/features/palace'
import { usePalaceStoreApi, type Palace } from '@/entities/palace'
import { fileToAvatar } from '@/shared/lib'
import { Button, PalaceCover, Sheet, TextField } from '@/shared/ui'

export interface PalaceAppearanceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  palace: Palace
}

/** Edit a palace's whole identity in one bottom sheet — name, any-emoji icon, a brand colour,
 * and an optional cover photo — instead of a separate appearance page. Holds a draft and
 * commits on Save through the palace command layer, so a cancel leaves the palace untouched. */
export function PalaceAppearanceSheet({ open, onOpenChange, palace }: PalaceAppearanceSheetProps) {
  const { t } = useTranslation()
  const store = usePalaceStoreApi()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(palace.name)
  const [icon, setIcon] = useState(palace.icon)
  const [color, setColor] = useState(palace.color)
  const [image, setImage] = useState(palace.image)

  // Reseed the draft each time the sheet opens (or the palace identity changes underneath).
  useEffect(() => {
    if (!open) return
    setName(palace.name)
    setIcon(palace.icon)
    setColor(palace.color)
    setImage(palace.image)
  }, [open, palace.name, palace.icon, palace.color, palace.image])

  const valid = name.trim().length > 0
  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!valid) return
    void editPalace(store, palace.id, { name: name.trim(), icon, color, image })
    onOpenChange(false)
  }

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setImage(await fileToAvatar(file))
    event.target.value = ''
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('palaceSettings.editAppearance')}
      footer={
        <Button size="lg" className="w-full" disabled={!valid} onClick={() => submit()}>
          <Check className="size-[18px]" aria-hidden />
          {t('common.saveChanges')}
        </Button>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5 pb-2">
        <TextField
          aria-label={t('palaceSettings.nameLabel')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('palaces.createNamePlaceholder')}
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

        <div>
          <p className="mb-2 text-[length:var(--p-text-label)] font-semibold text-heading">
            {t('palaceSettings.coverPhoto')}
          </p>
          <div className="flex items-center gap-3">
            <PalaceCover
              icon={icon}
              color={color}
              image={image}
              className="size-16 shrink-0 rounded-card shadow-rest"
              iconClassName="text-3xl"
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="size-[18px]" aria-hidden />
                {image ? t('palaceSettings.replacePhoto') : t('palaceSettings.addPhoto')}
              </Button>
              {image ? (
                <Button size="sm" variant="ghost" onClick={() => setImage(undefined)}>
                  {t('palaceSettings.removePhoto')}
                </Button>
              ) : null}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhoto}
          />
        </div>
      </form>
    </Sheet>
  )
}
