import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button, Sheet, TextField } from '@/shared/ui'
import type { Card } from '@/entities/card'
import type { CardChanges } from '../model/types'

export interface InStudyEditorProps {
  open: boolean
  card: Card
  onClose: () => void
  onSave: (changes: CardChanges) => void
}

const fieldClass =
  'w-full rounded-control border border-border bg-card px-3.5 py-3 text-[length:var(--p-text-body)] text-foreground placeholder:text-muted-foreground'

/** Edit the active card without leaving the session. Saves front/back/place/tip
 * through the host's `onEditCard` command (the same write-path as the editor page). */
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
      <div className="flex flex-col gap-3 pb-2">
        <Field label={t('study.frontLabel')}>
          <TextField
            value={front}
            onChange={(event) => setFront(event.target.value)}
            placeholder={t('study.frontPlaceholder')}
            enterKeyHint="next"
          />
        </Field>
        <Field label={t('study.backLabel')}>
          <textarea
            value={back}
            onChange={(event) => setBack(event.target.value)}
            placeholder={t('study.backPlaceholder')}
            rows={3}
            className={cn(fieldClass, 'resize-none')}
          />
        </Field>
        <Field label={t('study.placeLabel')}>
          <textarea
            value={hint}
            onChange={(event) => setHint(event.target.value)}
            placeholder={t('study.placePlaceholder')}
            rows={2}
            className={cn(fieldClass, 'resize-none')}
          />
        </Field>
        <Field label={t('study.tipLabel')}>
          <textarea
            value={tip}
            onChange={(event) => setTip(event.target.value)}
            placeholder={t('study.tipPlaceholder')}
            rows={2}
            className={cn(fieldClass, 'resize-none')}
          />
        </Field>
      </div>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[length:var(--p-text-label)] font-semibold text-heading">
        {label}
      </span>
      {children}
    </label>
  )
}
