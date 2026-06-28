import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Camera, X } from 'lucide-react'
import { fileToAvatar } from '@/shared/lib'
import { IconButton, PalaceCover, TextField } from '@/shared/ui'
import { IconColorRow } from '@/features/palace'
import * as React from 'react'

export interface PalaceIdentityFieldsProps {
  name: string
  icon: string
  color: string
  image?: string
  onNameChange: (value: string) => void
  onIconChange: (value: string) => void
  onColorChange: (value: string) => void
  onImageChange: (value: string | undefined) => void
  /** Autofocus the name field on mount (create flow only). */
  autoFocusName?: boolean
  /** Show the cover-photo control. Off in the create sheet — a cover is added later from
   * palace settings — on everywhere the full identity is edited. */
  showCover?: boolean
}

/** A palace's full identity in one block: a live cover preview that doubles as the photo
 * control, the name, and the shared icon-and-colour row. Shared by the create sheet and the
 * appearance drawer so a palace looks the same wherever it's edited. Stateless — the caller
 * owns the values and persistence. */
export function PalaceIdentityFields({
  name,
  icon,
  color,
  image,
  onNameChange,
  onIconChange,
  onColorChange,
  onImageChange,
  autoFocusName = false,
  showCover = true,
}: PalaceIdentityFieldsProps) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      onImageChange(await fileToAvatar(file))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('palaces.photoError'))
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Live cover — exactly what the card will show — doubling as the photo control. Hidden
          in the create flow, where a cover is added later from palace settings. */}
      {showCover ? (
        <div className="relative overflow-hidden rounded-card shadow-rest">
          <PalaceCover
            icon={icon}
            color={color}
            image={image}
            className="h-28 w-full"
            iconClassName="text-5xl"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 p-2.5">
            {image ? (
              <IconButton
                variant="glass"
                size="sm"
                aria-label={t('palaces.removeCover')}
                onClick={() => onImageChange(undefined)}
              >
                <X className="size-4" aria-hidden />
              </IconButton>
            ) : null}
            <IconButton
              variant="glass"
              size="sm"
              aria-label={image ? t('palaces.changeCover') : t('palaces.addCover')}
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="size-4" aria-hidden />
            </IconButton>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhoto}
          />
        </div>
      ) : null}

      <TextField
        aria-label={t('palaces.createName')}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder={t('palaces.createNamePlaceholder')}
        autoFocus={autoFocusName}
        enterKeyHint="done"
        maxLength={60}
      />

      <IconColorRow
        icon={icon}
        color={color}
        onIconChange={onIconChange}
        onColorChange={onColorChange}
        label={t('palaces.iconColorLabel')}
        iconLabel={t('palaces.iconLabel')}
      />
    </div>
  )
}
