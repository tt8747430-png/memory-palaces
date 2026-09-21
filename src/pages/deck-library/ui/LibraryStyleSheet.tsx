import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import {
  type CardStyle,
  type Deck,
  DEFAULT_CARD_STYLE,
  resolveDeckSettings,
  useDeckStoreApi,
} from '@/entities/deck'
import { applyCardStyle } from '@/features/deck'
import { CardStyleFields, StylePreview } from '@/widgets/card-style-form'
import { Button, CardScene, Sheet } from '@/shared/ui'

export interface LibraryStyleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  decks: Deck[]
  /** The decks the style is for. Folders in the selection carry no style of their own. */
  deckIds: string[]
  onApplied: () => void
}

/**
 * A card style for the decks that are selected. It composes the same whole `CardStyle` the deck's
 * own style screen does, and starts from the style the first selected deck already shows, so the
 * sheet opens on something recognisable rather than on the default.
 */
export function LibraryStyleSheet({
  open,
  onOpenChange,
  decks,
  deckIds,
  onApplied,
}: LibraryStyleSheetProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const [style, setStyle] = useState<CardStyle>(DEFAULT_CARD_STYLE)

  const first = deckIds[0]

  useEffect(() => {
    if (!open) return
    setStyle(first ? resolveDeckSettings(decks, first).cardStyle : DEFAULT_CARD_STYLE)
    // The style is seeded once, when the sheet opens; editing it afterwards is the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, first])

  const apply = async () => {
    const changed = await applyCardStyle(deckStore, style, { kind: 'ids', ids: deckIds })
    onOpenChange(false)
    onApplied()
    toast.success(t('cardStyle.appliedToDecks', { count: changed }))
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('cardStyle.title')}
      description={t('library.select.styleCount', { count: deckIds.length })}
      footer={
        <Button
          size="lg"
          className="w-full"
          disabled={deckIds.length === 0}
          onClick={() => void apply()}
        >
          <Check className="size-4.5" aria-hidden />
          {t('cardStyle.apply')}
        </Button>
      }
    >
      <div className="flex flex-col gap-6 pb-2">
        <CardScene style={style} className="grid h-40 place-items-center rounded-card px-4 py-3">
          <StylePreview
            style={style}
            front={t('cardStyle.previewFront')}
            back={t('cardStyle.previewBack')}
            className="h-full w-full"
          />
        </CardScene>

        <CardStyleFields style={style} onChange={setStyle} />
      </div>
    </Sheet>
  )
}
