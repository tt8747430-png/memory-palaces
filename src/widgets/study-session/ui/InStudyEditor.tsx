import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Button, Sheet } from '@/shared/ui'
import { CardFields } from '@/widgets/content-editor'
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
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [tip, setTip] = useState('')

  useEffect(() => {
    if (!open) return
    setFront(card.front)
    setBack(card.back)
    setHint(card.hint ?? '')
    setTip(card.tip ?? '')
  }, [open, card])

  const valid = front.trim().length > 0 && back.trim().length > 0
  const save = () => {
    if (!valid) return
    onSave({
      front: front.trim(),
      back: back.trim(),
      hint: hint.trim() || undefined,
      tip: tip.trim() || undefined,
    })
    onClose()
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t('study.editTitle')}
      footer={
        <Button className="w-full" disabled={!valid} onClick={save}>
          <Check className="size-[18px]" aria-hidden />
          {t('study.saveCard')}
        </Button>
      }
    >
      <div className="pb-2">
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
      </div>
    </Sheet>
  )
}
