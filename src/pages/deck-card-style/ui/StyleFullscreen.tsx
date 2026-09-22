import { useTranslation } from 'react-i18next'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { CardStyle } from '@/entities/deck'
import { CardScene, FullscreenDialog } from '@/shared/ui'
import { StylePreview } from '@/widgets/card-style-form'

export interface StyleFullscreenProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  style: CardStyle
  front: string
  back: string
}

export function StyleFullscreen({ open, onOpenChange, style, front, back }: StyleFullscreenProps) {
  const { t } = useTranslation()
  return (
    <FullscreenDialog open={open} onOpenChange={onOpenChange}>
      <CardScene
        style={style}
        underStatusBar
        className="flex h-full w-full flex-col gap-4 px-5 pb-(--app-bottom-inset) pt-safe"
      >
        <Dialog.Title className="sr-only">{t('cardStyle.fullscreen')}</Dialog.Title>
        <StylePreview style={style} front={front} back={back} className="mt-4 min-h-0 flex-1" />
        <div className="flex shrink-0 pb-4">
          <Dialog.Close
            aria-label={t('common.close')}
            className="grid size-12 place-items-center rounded-full bg-card-glass text-heading shadow-rest ring-1 ring-(--border-glass) transition-transform active:scale-95"
          >
            <X className="size-5" aria-hidden />
          </Dialog.Close>
        </div>
      </CardScene>
    </FullscreenDialog>
  )
}
