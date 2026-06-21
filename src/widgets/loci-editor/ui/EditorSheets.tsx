import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Plus, X } from 'lucide-react'
import type { Locus } from '@/entities/locus'
import type { Question } from '@/entities/question'
import { cn } from '@/shared/lib'
import { Button, Sheet, TextField, Textarea } from '@/shared/ui'

export interface CardData {
  front: string
  back: string
  hint?: string
  tip?: string
}

export interface QuestionData {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

function FieldLabel({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <span className="text-[length:var(--p-text-label)] font-semibold text-heading">{children}</span>
      {count !== undefined ? (
        <span className="text-[length:var(--p-text-tiny)] tabular-nums text-muted-foreground">
          {count}
        </span>
      ) : null}
    </div>
  )
}

/** Create/edit a card (front/back + optional place cue and peek hint). Offers
 * "Save & add another" when creating, to keep a deck-building flow moving. */
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
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel count={front.length}>{t('loci.editor.front')}</FieldLabel>
          <TextField
            ref={frontRef}
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder={t('loci.editor.frontPlaceholder')}
            enterKeyHint="next"
          />
        </div>
        <div>
          <FieldLabel count={back.length}>{t('loci.editor.back')}</FieldLabel>
          <Textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder={t('loci.editor.backPlaceholder')}
            rows={3}
          />
        </div>
        <div>
          <FieldLabel>{t('loci.editor.hint')}</FieldLabel>
          <Textarea
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder={t('loci.editor.hintPlaceholder')}
            rows={2}
          />
        </div>
        <div>
          <FieldLabel>{t('loci.editor.tip')}</FieldLabel>
          <Textarea
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            placeholder={t('loci.editor.tipPlaceholder')}
            rows={2}
          />
        </div>
      </div>
    </Sheet>
  )
}

const MAX_OPTIONS = 6
const MIN_OPTIONS = 2

/** Create/edit a multiple-choice question with 2–6 options and an optional explanation. */
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

  const filled = options.map((o) => o.trim())
  const valid =
    prompt.trim().length > 0 &&
    filled.filter(Boolean).length >= MIN_OPTIONS &&
    (filled[correct]?.length ?? 0) > 0

  const setOption = (i: number, value: string) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)))
  const addOption = () => setOptions((prev) => (prev.length < MAX_OPTIONS ? [...prev, ''] : prev))
  const removeOption = (i: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== i))
    setCorrect((prev) => (i === prev ? 0 : i < prev ? prev - 1 : prev))
  }

  const save = () => {
    if (!valid) return
    const kept: string[] = []
    let newCorrect = 0
    options.forEach((o, i) => {
      if (o.trim()) {
        if (i === correct) newCorrect = kept.length
        kept.push(o.trim())
      }
    })
    onSave({
      prompt: prompt.trim(),
      options: kept,
      correctAnswer: newCorrect,
      ...(explanation.trim() ? { explanation: explanation.trim() } : {}),
    })
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
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel count={prompt.length}>{t('questions.editor.prompt')}</FieldLabel>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('questions.editor.promptPlaceholder')}
            rows={2}
          />
        </div>

        <div>
          <FieldLabel>{t('questions.editor.options')}</FieldLabel>
          <p className="-mt-1 mb-2 text-[length:var(--p-text-label)] text-muted-foreground">
            {t('questions.editor.optionsHint')}
          </p>
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => {
              const isCorrect = i === correct
              return (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrect(i)}
                    aria-label={
                      isCorrect
                        ? t('questions.editor.correctAnswer')
                        : t('questions.editor.markCorrect')
                    }
                    aria-pressed={isCorrect}
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors',
                      isCorrect
                        ? 'border-success bg-success text-[color:var(--surface)]'
                        : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    {isCorrect ? (
                      <Check className="size-[15px]" strokeWidth={3} aria-hidden />
                    ) : (
                      <span className="text-[length:var(--p-text-label)] font-bold">
                        {String.fromCharCode(65 + i)}
                      </span>
                    )}
                  </button>
                  <TextField
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={t('questions.editor.optionPlaceholder', {
                      letter: String.fromCharCode(65 + i),
                    })}
                    className="flex-1"
                  />
                  {options.length > MIN_OPTIONS ? (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      aria-label={t('questions.editor.removeOption')}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--danger-surface)] hover:text-[var(--danger-on-surface)]"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
          {options.length < MAX_OPTIONS ? (
            <button
              type="button"
              onClick={addOption}
              className="mt-2.5 inline-flex items-center gap-1.5 text-[length:var(--p-text-label)] font-semibold text-accent transition-colors hover:text-heading"
            >
              <Plus className="size-[15px]" aria-hidden />
              {t('questions.editor.addOption')}
            </button>
          ) : null}
        </div>

        <div>
          <FieldLabel>{t('questions.editor.explanation')}</FieldLabel>
          <Textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder={t('questions.editor.explanationPlaceholder')}
            rows={2}
          />
        </div>
      </div>
    </Sheet>
  )
}
