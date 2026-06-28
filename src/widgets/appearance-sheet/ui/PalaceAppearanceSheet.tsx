import { type SyntheticEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { editPalace, PalaceIdentityFields } from '@/features/palace'
import { type Palace, usePalaceStoreApi } from '@/entities/palace'
import { Button, Sheet } from '@/shared/ui'

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
  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault()
    if (!valid) return
    void editPalace(store, palace.id, { name: name.trim(), icon, color, image })
    onOpenChange(false)
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
      <form onSubmit={submit} className="pb-1">
        <PalaceIdentityFields
          name={name}
          icon={icon}
          color={color}
          image={image}
          onNameChange={setName}
          onIconChange={setIcon}
          onColorChange={setColor}
          onImageChange={setImage}
        />
      </form>
    </Sheet>
  )
}
