import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, List, Sparkles } from 'lucide-react'
import { cn, parseDelimitedNotes, parseVerses } from '@/shared/lib'
import { AppScreen, Button, ScreenHeader, TextField, Textarea } from '@/shared/ui'
import { useImportDraft } from '@/widgets/content-editor'

export interface PasteNotesPageProps {
  onBack: () => void
  /** Seed committed — go to the shared review page. */
  onReview: () => void
}

type Kind = 'notes' | 'bible'
type FieldSep = 'tab' | 'comma' | 'custom'
type CardSep = 'newline' | 'semicolon' | 'custom'

const FIELD_VALUE: Record<Exclude<FieldSep, 'custom'>, string> = { tab: '\t', comma: ',' }
const CARD_VALUE: Record<Exclude<CardSep, 'custom'>, string> = { newline: '\n', semicolon: ';' }

/**
 * Step one of the paste import: choose the kind (delimited Notes or a Bible chapter), paste
 * the text, and tune the separators, with a live "N cards found" count. "Create" parses the
 * text into a draft and hands off to the shared review page — nothing is written to the room
 * until the user confirms there.
 */
export function PasteNotesPage({ onBack, onReview }: PasteNotesPageProps) {
  const { t } = useTranslation()
  const setDraft = useImportDraft((s) => s.setDraft)

  const [kind, setKind] = useState<Kind>('notes')
  const [text, setText] = useState('')
  const [fieldSep, setFieldSep] = useState<FieldSep>('comma')
  const [cardSep, setCardSep] = useState<CardSep>('newline')
  const [customField, setCustomField] = useState('')
  const [customCard, setCustomCard] = useState('')

  const field = fieldSep === 'custom' ? customField : FIELD_VALUE[fieldSep]
  const card = cardSep === 'custom' ? customCard || '\n' : CARD_VALUE[cardSep]

  const cards = useMemo(() => {
    if (!text.trim()) return []
    if (kind === 'bible') return parseVerses(text)
    if (!field) return []
    return parseDelimitedNotes(text, { field, card })
  }, [text, kind, field, card])

  const create = () => {
    if (cards.length === 0) return
    setDraft('paste', cards)
    onReview()
  }

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader title={t('cards.paste.title')} onBack={onBack} backLabel={t('common.back')} />
      }
      footer={
        <div className="bg-glass shrink-0 border-t border-white/40 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_oklch(var(--p-tint-navy)/0.1)]">
          <Button size="lg" className="w-full" disabled={cards.length === 0} onClick={create}>
            <Sparkles className="size-[18px]" aria-hidden />
            {t('cards.paste.create')}
          </Button>
        </div>
      }
    >
      <div className="mt-4 flex flex-col gap-6 pb-6">
        <OptionGroup<Kind>
          label={t('cards.paste.kindLabel')}
          value={kind}
          onChange={setKind}
          options={[
            {
              value: 'notes',
              label: t('cards.paste.kindNotes'),
              description: t('cards.paste.kindNotesSub'),
              icon: <List className="size-[18px]" aria-hidden />,
            },
            {
              value: 'bible',
              label: t('cards.paste.kindBible'),
              description: t('cards.paste.kindBibleSub'),
              icon: <BookOpen className="size-[18px]" aria-hidden />,
            },
          ]}
        />

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-[length:var(--p-text-sub)] font-bold text-heading">
              {t('cards.paste.dataLabel')}
            </span>
            <CountBadge count={cards.length} />
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              kind === 'bible'
                ? t('cards.paste.biblePlaceholder')
                : t('cards.paste.notesPlaceholder')
            }
            rows={8}
            className="min-h-[184px] font-mono text-[length:var(--p-text-label)] leading-relaxed"
            autoFocus
          />
        </div>

        {kind === 'bible' ? (
          <div className="flex items-start gap-3 rounded-card bg-info-surface p-4">
            <BookOpen className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="text-[length:var(--p-text-sub)] font-semibold text-heading">
                {t('cards.paste.bibleHintTitle')}
              </p>
              <p className="mt-0.5 text-[length:var(--p-text-label)] leading-snug text-info-foreground">
                {t('cards.paste.bibleHint')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <OptionGroup<FieldSep>
              label={t('cards.paste.fieldLabel')}
              value={fieldSep}
              onChange={setFieldSep}
              options={[
                { value: 'tab', label: t('cards.paste.sepTab'), hint: '⇥' },
                { value: 'comma', label: t('cards.paste.sepComma'), hint: ',' },
                { value: 'custom', label: t('cards.paste.sepCustom') },
              ]}
              footer={
                fieldSep === 'custom' ? (
                  <CustomField
                    value={customField}
                    onChange={setCustomField}
                    placeholder={t('cards.paste.customFieldPlaceholder')}
                  />
                ) : undefined
              }
            />
            <OptionGroup<CardSep>
              label={t('cards.paste.cardLabel')}
              value={cardSep}
              onChange={setCardSep}
              options={[
                { value: 'newline', label: t('cards.paste.sepNewline'), hint: '↵' },
                { value: 'semicolon', label: t('cards.paste.sepSemicolon'), hint: ';' },
                { value: 'custom', label: t('cards.paste.sepCustom') },
              ]}
              footer={
                cardSep === 'custom' ? (
                  <CustomField
                    value={customCard}
                    onChange={setCustomCard}
                    placeholder={t('cards.paste.customCardPlaceholder')}
                  />
                ) : undefined
              }
            />
          </div>
        )}
      </div>
    </AppScreen>
  )
}

function CountBadge({ count }: { count: number }) {
  const { t } = useTranslation()
  if (count === 0) return null
  return (
    <span className="rounded-pill bg-info-surface px-2.5 py-1 text-[length:var(--p-text-tiny)] font-bold tabular-nums text-info-foreground">
      {t('cards.paste.found', { count })}
    </span>
  )
}

interface Option<T extends string> {
  value: T
  label: string
  description?: string
  /** Leading glyph, tinted accent when the row is selected. */
  icon?: ReactNode
  /** A right-aligned monospace chip showing the literal this option stands for (e.g. `,`). */
  hint?: string
}

/**
 * A single-select list of rows, each with a radio indicator — the clearer alternative to a
 * segmented toggle for a set of options. Rows sit in one bordered card; an optional `footer`
 * (e.g. a custom-value field) drops in under the last row.
 */
function OptionGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  footer,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<Option<T>>
  footer?: ReactNode
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-[length:var(--p-text-label)] font-semibold text-heading">
        {label}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        className="overflow-hidden rounded-card border border-border bg-card shadow-rest"
      >
        {options.map((option, i) => {
          const selected = option.value === value
          const divide = i < options.length - 1 || Boolean(footer)
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                divide && 'border-b border-border',
                selected ? 'bg-info-surface' : 'active:bg-info-surface/60',
              )}
            >
              <RadioDot selected={selected} />
              {option.icon ? (
                <span
                  className={cn('shrink-0', selected ? 'text-accent' : 'text-muted-foreground')}
                  aria-hidden
                >
                  {option.icon}
                </span>
              ) : null}
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate text-[length:var(--p-text-body)] font-semibold',
                    selected ? 'text-heading' : 'text-foreground',
                  )}
                >
                  {option.label}
                </span>
                {option.description ? (
                  <span className="block truncate text-[length:var(--p-text-label)] text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </span>
              {option.hint ? (
                <span
                  className="shrink-0 rounded-md bg-primary/[0.06] px-1.5 py-0.5 font-mono text-[length:var(--p-text-label)] text-muted-foreground"
                  aria-hidden
                >
                  {option.hint}
                </span>
              ) : null}
            </button>
          )
        })}
        {footer}
      </div>
    </fieldset>
  )
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
        selected ? 'border-primary' : 'border-border',
      )}
    >
      {selected ? <span className="size-2.5 rounded-full bg-primary" /> : null}
    </span>
  )
}

function CustomField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="p-3">
      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono"
        autoFocus
      />
    </div>
  )
}
