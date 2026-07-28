import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Button, Sheet } from '@/shared/ui'
import { CardFields, useCardDraft } from '@/widgets/content-editor'
import type { Card } from '@/entities/card'
import type { CardChanges } from '../model/types'

export interface InStudyEditorProps {
  open: boolean
  card: Card
  onClose: () => void
  onSave: (changes: CardChanges) => void
}

export function InStudyEditor({ open, card, onClose, onSave }: InStudyEditorProps) {
  const { t } = useTranslation()
  const draft = useCardDraft(card, open ? card.id : null)

  const save = () => {
    if (!draft.valid) return
    onSave(draft.changes)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t('study.editTitle')}
      footer={
        <Button className="w-full" disabled={!draft.valid} onClick={save}>
          <Check className="size-[18px]" aria-hidden />
          {t('study.saveCard')}
        </Button>
      }
    >
      <div className="pb-2">
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
      </div>
    </Sheet>
  )
}
