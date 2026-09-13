import { useTranslation } from 'react-i18next'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { CardStyle } from '@/entities/deck'
import { CardScene, FullscreenDialog } from '@/shared/ui'
import { StylePreview } from './StylePreview'

export interface StyleFullscreenProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  style: CardStyle
  front: string
  back: string
}

/**
 * The style at the size it is actually studied at. The pinned pane on the screen below is a third
 * of the shell and has controls under it; a long card there is mostly scrollbar, and the only
 * honest answer to "does this read well" is the whole screen.
 *
 * It previews the draft, not the saved style — the same `style` the pane and the strip are showing
 * — so it can be opened mid-edit and closed without touching the deck.
 */
export function StyleFullscreen({ open, onOpenChange, style, front, back }: StyleFullscreenProps) {
  const { t } = useTranslation()
  return (
    <FullscreenDialog open={open} onOpenChange={onOpenChange}>
      {/* The scene is the room, so it runs under the safe areas and the close button sits on it —
          inside `CardScene`, the button's glass and ink come from the scene's chrome rather than
          the app's theme. */}
      <CardScene
        style={style}
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
