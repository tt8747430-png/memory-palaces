import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Sparkles } from 'lucide-react'
import { parseDelimitedNotes, parseVerses } from '@/shared/lib'
import { AppScreen, Button, ScreenHeader, SegmentedControl, TextField, Textarea } from '@/shared/ui'
import { useImportDraft } from '@/widgets/loci-editor'

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
      header={<ScreenHeader title={t('loci.paste.title')} onBack={onBack} backLabel={t('roomHub.back')} />}
      footer={
        <div className="bg-glass shrink-0 border-t border-white/40 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_oklch(var(--p-tint-navy)/0.1)]">
          <Button size="lg" className="w-full" disabled={cards.length === 0} onClick={create}>
            <Sparkles className="size-[18px]" aria-hidden />
            {t('loci.paste.create')}
          </Button>
        </div>
      }
    >
      <div className="mt-4 flex flex-col gap-6 pb-6">
        <SegmentedControl<Kind>
          aria-label={t('loci.paste.kindLabel')}
          options={[
            { value: 'notes', label: t('loci.paste.kindNotes') },
            { value: 'bible', label: t('loci.paste.kindBible') },
          ]}
          value={kind}
          onChange={setKind}
        />

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-[length:var(--p-text-sub)] font-bold text-heading">
              {t('loci.paste.dataLabel')}
            </span>
            <CountBadge count={cards.length} />
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={kind === 'bible' ? t('loci.paste.biblePlaceholder') : t('loci.paste.notesPlaceholder')}
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
                {t('loci.paste.bibleHintTitle')}
              </p>
              <p className="mt-0.5 text-[length:var(--p-text-label)] leading-snug text-info-foreground">
                {t('loci.paste.bibleHint')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <DelimiterGroup<FieldSep>
              label={t('loci.paste.fieldLabel')}
              value={fieldSep}
              onChange={setFieldSep}
              options={[
                { value: 'tab', label: t('loci.paste.sepTab') },
                { value: 'comma', label: t('loci.paste.sepComma') },
                { value: 'custom', label: t('loci.paste.sepCustom') },
              ]}
              custom={fieldSep === 'custom'}
              customValue={customField}
              onCustom={setCustomField}
              customPlaceholder={t('loci.paste.customFieldPlaceholder')}
            />
            <DelimiterGroup<CardSep>
              label={t('loci.paste.cardLabel')}
              value={cardSep}
              onChange={setCardSep}
              options={[
                { value: 'newline', label: t('loci.paste.sepNewline') },
                { value: 'semicolon', label: t('loci.paste.sepSemicolon') },
                { value: 'custom', label: t('loci.paste.sepCustom') },
              ]}
              custom={cardSep === 'custom'}
              customValue={customCard}
              onCustom={setCustomCard}
              customPlaceholder={t('loci.paste.customCardPlaceholder')}
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
      {t('loci.paste.found', { count })}
    </span>
  )
}

/** A labelled separator picker: a 3-way segmented toggle with an inline field when Custom. */
function DelimiterGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  custom,
  customValue,
  onCustom,
  customPlaceholder,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
  custom: boolean
  customValue: string
  onCustom: (value: string) => void
  customPlaceholder: string
}) {
  return (
    <div>
      <span className="mb-2 block text-[length:var(--p-text-label)] font-semibold text-heading">
        {label}
      </span>
      <SegmentedControl<T> aria-label={label} options={options} value={value} onChange={onChange} size="sm" />
      {custom ? (
        <TextField
          value={customValue}
          onChange={(e) => onCustom(e.target.value)}
          placeholder={customPlaceholder}
          className="mt-2 font-mono"
        />
      ) : null}
    </div>
  )
}
