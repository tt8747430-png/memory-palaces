import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ImagePlus, Trash2 } from 'lucide-react'
import { DECK_IMAGE_PX, fileToSquareImage } from '@/shared/lib'
import { Button, DeckCover, useFilePicker } from '@/shared/ui'

export interface DeckCoverPickerProps {
  icon: string
  color: string
  image: string | null
  onChange: (image: string | null) => void
}

const ACCEPT = 'image/*'

/**
 * The deck's cover, chosen from a photo. The image is cropped and re-encoded here so what the
 * preview shows is exactly what gets stored — and so an enormous camera file never reaches the
 * document.
 */
export function DeckCoverPicker({ icon, color, image, onChange }: DeckCoverPickerProps) {
  const { t } = useTranslation()
  const picker = useFilePicker(ACCEPT, (file) => {
    void fileToSquareImage(file, DECK_IMAGE_PX)
      .then(onChange)
      .catch(() => toast.error(t('deckSettings.coverError')))
  })

  return (
    <div className="flex items-center gap-3.5">
      <DeckCover
        icon={icon}
        color={color}
        image={image ?? undefined}
        className="size-16 shrink-0 rounded-card shadow-rest"
        iconClassName="text-3xl"
      />
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={picker.open}>
          <ImagePlus className="size-4.5" aria-hidden />
          {image ? t('deckSettings.coverChange') : t('deckSettings.coverAdd')}
        </Button>
        {image ? (
          <Button type="button" variant="ghost" onClick={() => onChange(null)}>
            <Trash2 className="size-4.5" aria-hidden />
            {t('deckSettings.coverRemove')}
          </Button>
        ) : null}
      </div>
      {picker.input}
    </div>
  )
}
