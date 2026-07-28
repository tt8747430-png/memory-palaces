import { useTranslation } from 'react-i18next'
import { Button, Sheet } from '@/shared/ui'
import {
  CardFields,
  type DraftCard,
  type DraftCardEdit,
  useCardDraft,
} from '@/widgets/content-editor'

export interface EditDraftSheetProps {
  card: DraftCard | null
  onSave: (id: string, edit: DraftCardEdit) => void
  onClose: () => void
}

export function EditDraftSheet({ card, onSave, onClose }: EditDraftSheetProps) {
  const { t } = useTranslation()
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
      title={t('cards.review.editTitle')}
      footer={
        <Button size="lg" className="w-full" disabled={!draft.valid} onClick={save}>
          {t('common.saveChanges')}
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
