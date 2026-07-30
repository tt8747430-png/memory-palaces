import { type ReactNode, type RefObject, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Check, Lightbulb, MapPin, MessageSquareText, Plus, X } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Input, Textarea } from '@/shared/ui'
import { MAX_OPTIONS, MIN_OPTIONS } from './editor-helpers'

function FieldLabel({
  children,
  htmlFor,
  count,
  icon,
  emphasis = false,
}: {
  children: ReactNode
  htmlFor: string
  count?: number
  icon?: ReactNode
  emphasis?: boolean
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <label
        htmlFor={htmlFor}
        className={cn(
          'inline-flex items-center gap-1.5 text-heading',
          emphasis
            ? 'text-(length:--p-text-sub) font-bold'
            : 'text-(length:--p-text-label) font-semibold',
        )}
      >
        {icon ? (
          <span className="shrink-0" aria-hidden>
            {icon}
          </span>
        ) : null}
        {children}
      </label>
      {count !== undefined ? (
        <span className="text-(length:--p-text-tiny) tabular-nums text-muted-foreground">
          {count}
        </span>
      ) : null}
    </div>
  )
}

export function CardFields({
  front,
  back,
  hint,
  tip,
  onFront,
  onBack,
  onHint,
  onTip,
  frontRef,
}: {
  front: string
  back: string
  hint: string
  tip: string
  onFront: (value: string) => void
  onBack: (value: string) => void
  onHint: (value: string) => void
  onTip: (value: string) => void
  frontRef?: RefObject<HTMLInputElement | null>
}) {
  const { t } = useTranslation()
  const ids = useId()
  const fieldId = (name: string) => `${ids}-${name}`
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel
            emphasis
            htmlFor={fieldId('front')}
            count={front.length}
            icon={<MessageSquareText className="size-4.5 text-heading" aria-hidden />}
          >
            {t('cards.editor.front')}
          </FieldLabel>
          <Input
            id={fieldId('front')}
            ref={frontRef}
            value={front}
            onChange={(e) => onFront(e.target.value)}
            placeholder={t('cards.editor.frontPlaceholder')}
            enterKeyHint="next"
          />
        </div>
        <div>
          <FieldLabel
            emphasis
            htmlFor={fieldId('back')}
            count={back.length}
            icon={<BookOpen className="size-4.5 text-heading" aria-hidden />}
          >
            {t('cards.editor.back')}
          </FieldLabel>
          <Textarea
            id={fieldId('back')}
            value={back}
            onChange={(e) => onBack(e.target.value)}
            placeholder={t('cards.editor.backPlaceholder')}
            rows={3}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5">
        <div>
          <FieldLabel
            htmlFor={fieldId('hint')}
            icon={<MapPin className="size-3.5 text-accent" aria-hidden />}
          >
            {t('cards.editor.hint')}
          </FieldLabel>
          <Textarea
            id={fieldId('hint')}
            value={hint}
            onChange={(e) => onHint(e.target.value)}
            placeholder={t('cards.editor.hintPlaceholder')}
            rows={2}
          />
        </div>
        <div>
          <FieldLabel
            htmlFor={fieldId('tip')}
            icon={<Lightbulb className="size-3.5 text-(--warning-foreground)" aria-hidden />}
          >
            {t('cards.editor.tip')}
          </FieldLabel>
          <Textarea
            id={fieldId('tip')}
            value={tip}
            onChange={(e) => onTip(e.target.value)}
            placeholder={t('cards.editor.tipPlaceholder')}
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

export function QuestionFields({
  prompt,
  options,
  correct,
  explanation,
  onPrompt,
  onOption,
  onAddOption,
  onRemoveOption,
  onCorrect,
  onExplanation,
}: {
  prompt: string
  options: string[]
  correct: number
  explanation: string
  onPrompt: (value: string) => void
  onOption: (index: number, value: string) => void
  onAddOption: () => void
  onRemoveOption: (index: number) => void
  onCorrect: (index: number) => void
  onExplanation: (value: string) => void
}) {
  const { t } = useTranslation()
  const ids = useId()
  const fieldId = (name: string) => `${ids}-${name}`
  return (
    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel htmlFor={fieldId('prompt')} count={prompt.length}>
          {t('questions.editor.prompt')}
        </FieldLabel>
        <Textarea
          id={fieldId('prompt')}
          value={prompt}
          onChange={(e) => onPrompt(e.target.value)}
          placeholder={t('questions.editor.promptPlaceholder')}
          rows={2}
        />
      </div>

      <div>
        <FieldLabel htmlFor={fieldId('option-0')}>{t('questions.editor.options')}</FieldLabel>
        <p className="-mt-1 mb-2 text-(length:--p-text-label) text-muted-foreground">
          {t('questions.editor.optionsHint')}
        </p>
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => {
            const isCorrect = i === correct
            return (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCorrect(i)}
                  aria-label={
                    isCorrect
                      ? t('questions.editor.correctAnswer')
                      : t('questions.editor.markCorrect')
                  }
                  aria-pressed={isCorrect}
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors',
                    isCorrect
                      ? 'border-success bg-success text-(--surface)'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {isCorrect ? (
                    <Check className="size-3.75" strokeWidth={3} aria-hidden />
                  ) : (
                    <span className="text-(length:--p-text-label) font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                  )}
                </button>
                <Input
                  id={fieldId(`option-${i}`)}
                  value={opt}
                  onChange={(e) => onOption(i, e.target.value)}
                  placeholder={t('questions.editor.optionPlaceholder', {
                    letter: String.fromCharCode(65 + i),
                  })}
                  className="flex-1"
                />
                {options.length > MIN_OPTIONS ? (
                  <button
                    type="button"
                    onClick={() => onRemoveOption(i)}
                    aria-label={t('questions.editor.removeOption')}
                    className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-(--danger-surface) hover:text-(--danger-on-surface)"
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
            onClick={onAddOption}
            className="mt-2.5 inline-flex items-center gap-1.5 text-(length:--p-text-label) font-semibold text-accent transition-colors hover:text-heading"
          >
            <Plus className="size-3.75" aria-hidden />
            {t('questions.editor.addOption')}
          </button>
        ) : null}
      </div>

      <div>
        <FieldLabel htmlFor={fieldId('explanation')}>
          {t('questions.editor.explanation')}
        </FieldLabel>
        <Textarea
          id={fieldId('explanation')}
          value={explanation}
          onChange={(e) => onExplanation(e.target.value)}
          placeholder={t('questions.editor.explanationPlaceholder')}
          rows={2}
        />
      </div>
    </div>
  )
}
