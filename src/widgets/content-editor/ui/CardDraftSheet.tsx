import type { ReactNode } from 'react'
import { Button, Sheet } from '@/shared/ui'
import type { CardDraftEdit, CardDraftSource } from '../model/use-card-draft'
import { useCardDraft } from '../model/use-card-draft'
import { CardFields } from './editor-fields'

export interface CardDraftSheetProps {
  /** The card under edit. `null` is what closes the sheet. */
  card: (CardDraftSource & { id: string }) | null
  title: string
  saveLabel: string
  saveIcon?: ReactNode
  onSave: (id: string, changes: CardDraftEdit) => void
  onClose: () => void
}

/**
 * The one sheet for editing a card's four fields, wherever the card is met — mid-study, or in an
 * import awaiting review.
 */
export function CardDraftSheet({
  card,
  title,
  saveLabel,
  saveIcon,
  onSave,
  onClose,
}: CardDraftSheetProps) {
  const draft = useCardDraft(card, card?.id ?? null)

  const save = () => {
    if (!card || !draft.valid) return
    onSave(card.id, draft.changes)
    onClose()
  }

  return (
    <Sheet
      open={card !== null}
      onOpenChange={(open) => !open && onClose()}
      title={title}
      footer={
        <Button size="lg" className="w-full" disabled={!draft.valid} onClick={save}>
          {saveIcon}
          {saveLabel}
        </Button>
      }
    >
      <CardFields
        front={draft.front}
        back={draft.back}
        hint={draft.hint}
        tip={draft.tip}
        onFront={draft.setFront}
        onBack={draft.setBack}
        onHint={draft.setHint}
        onTip={draft.setTip}
      />
    </Sheet>
  )
}
