import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Plus } from 'lucide-react'
import type { Locus } from '@/entities/locus'
import type { Question } from '@/entities/question'
import { Button, Sheet } from '@/shared/ui'
import { CardFields, QuestionFields } from './editor-fields'
import {
  buildQuestionData,
  type CardData,
  isQuestionValid,
  type QuestionData,
} from './editor-helpers'

export type { CardData, QuestionData } from './editor-helpers'

/** Create/edit a card (front/back + optional place cue and peek hint). Offers
 * "Save & add another" when creating, to keep a deck-building flow moving. The full-screen
 * routed editor is the app's primary path; this sheet stays for standalone/isolation use. */
export function CardEditorSheet({
  open,
  initial,
  onOpenChange,
  onSave,
  onSaveAndAddAnother,
}: {
  open: boolean
  initial: Locus | null
  onOpenChange: (open: boolean) => void
  onSave: (data: CardData) => void
  onSaveAndAddAnother: (data: CardData) => void
}) {
  const { t } = useTranslation()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [tip, setTip] = useState('')
  const frontRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setFront(initial?.front ?? '')
      setBack(initial?.back ?? '')
      setHint(initial?.hint ?? '')
      setTip(initial?.tip ?? '')
    }
  }, [open, initial])

  const valid = front.trim().length > 0 && back.trim().length > 0
  const build = (): CardData => ({
    front: front.trim(),
    back: back.trim(),
    ...(hint.trim() ? { hint: hint.trim() } : {}),
    ...(tip.trim() ? { tip: tip.trim() } : {}),
  })

  const addAnother = () => {
    if (!valid) return
    onSaveAndAddAnother(build())
    setFront('')
    setBack('')
    setHint('')
    setTip('')
    frontRef.current?.focus()
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? t('loci.editor.editTitle') : t('loci.editor.newTitle')}
      footer={
        <div className="flex flex-col gap-2.5">
          {!initial ? (
            <Button variant="ghost" size="lg" disabled={!valid} onClick={addAnother}>
              <Plus className="size-[18px]" aria-hidden />
              {t('loci.editor.saveAndAdd')}
            </Button>
          ) : null}
          <Button size="lg" disabled={!valid} onClick={() => valid && onSave(build())}>
            <Check className="size-[18px]" aria-hidden />
            {initial ? t('common.saveChanges') : t('loci.editor.save')}
          </Button>
        </div>
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
        frontRef={frontRef}
      />
    </Sheet>
  )
}

/** Create/edit a multiple-choice question with 2–6 options and an optional explanation. The
 * full-screen routed editor is the app's primary path; this sheet stays for standalone use. */
export function QuestionEditorSheet({
  open,
  initial,
  onOpenChange,
  onSave,
}: {
  open: boolean
  initial: Question | null
  onOpenChange: (open: boolean) => void
  onSave: (data: QuestionData) => void
}) {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [correct, setCorrect] = useState(0)
  const [explanation, setExplanation] = useState('')

  useEffect(() => {
    if (open) {
      setPrompt(initial?.prompt ?? '')
      setOptions(initial?.options ?? ['', ''])
      setCorrect(initial?.correctAnswer ?? 0)
      setExplanation(initial?.explanation ?? '')
    }
  }, [open, initial])

  const valid = isQuestionValid(prompt, options, correct)

  const setOption = (i: number, value: string) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)))
  const addOption = () => setOptions((prev) => (prev.length < 6 ? [...prev, ''] : prev))
  const removeOption = (i: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== i))
    setCorrect((prev) => (i === prev ? 0 : i < prev ? prev - 1 : prev))
  }

  const save = () => {
    if (!valid) return
    onSave(buildQuestionData(prompt, options, correct, explanation))
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? t('questions.editor.editTitle') : t('questions.editor.newTitle')}
      footer={
        <Button size="lg" className="w-full" disabled={!valid} onClick={save}>
          <Check className="size-[18px]" aria-hidden />
          {initial ? t('common.saveChanges') : t('questions.editor.save')}
        </Button>
      }
    >
      <QuestionFields
        prompt={prompt}
        options={options}
        correct={correct}
        explanation={explanation}
        onPrompt={setPrompt}
        onOption={setOption}
        onAddOption={addOption}
        onRemoveOption={removeOption}
        onCorrect={setCorrect}
        onExplanation={setExplanation}
      />
    </Sheet>
  )
}
