import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Sheet } from '@/shared/ui'
import { CardFields, type DraftCard, type DraftCardEdit } from '@/widgets/content-editor'

export interface EditDraftSheetProps {
  /** `null` closes the sheet; a card opens it on that card. */
  card: DraftCard | null
  onSave: (id: string, edit: DraftCardEdit) => void
  onClose: () => void
}

/** Fix a card before it is imported. Nothing is written until the batch is applied. */
export function EditDraftSheet({ card, onSave, onClose }: EditDraftSheetProps) {
  const { t } = useTranslation()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [tip, setTip] = useState('')

  useEffect(() => {
    if (card) {
      setFront(card.front)
      setBack(card.back)
      setHint(card.hint ?? '')
      setTip(card.tip ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id])

  const valid = front.trim().length > 0 && back.trim().length > 0
  const save = () => {
    if (!card || !valid) return
    onSave(card.id, {
      front: front.trim(),
      back: back.trim(),
      hint: hint.trim() || undefined,
      tip: tip.trim() || undefined,
    })
    onClose()
  }

  return (
    <Sheet
      open={card !== null}
      onOpenChange={(open) => !open && onClose()}
      title={t('cards.review.editTitle')}
      footer={
        <Button size="lg" className="w-full" disabled={!valid} onClick={save}>
          {t('common.saveChanges')}
        </Button>
      }
    >
      <CardFields
        front={front}
        back={back}
        hint={hint}
        tip={tip}
        onFront={setFront}
        onBack={setBack}
        onHint={setHint}
        onTip={setTip}
      />
    </Sheet>
  )
}
