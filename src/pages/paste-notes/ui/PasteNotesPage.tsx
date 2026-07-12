import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  ClipboardPaste,
  Eraser,
  List,
  Sparkles,
  Table,
  Wand2,
} from 'lucide-react'
import {
  cn,
  detectPasteFormat,
  guessFieldSeparator,
  type PasteFormat,
  type ParsedCard,
  parseDelimitedNotes,
  parseVerses,
} from '@/shared/lib'
import { AppScreen, Button, ScreenHeader, Switch, TextField, Textarea } from '@/shared/ui'
import { useImportDraft } from '@/widgets/content-editor'

export interface PasteNotesPageProps {
  onBack: () => void
  /** New-deck mode (library "Import"): show an inline deck-name field, pre-filled with
   * `defaultDeckName`, and pass the chosen name up on commit. Omit when pasting into an
   * existing deck — then no name is asked. */
  newDeck?: boolean
  defaultDeckName?: string
  /** Seed committed — go to the shared review page. In new-deck mode `deckName` carries the
   * name to create the deck with; otherwise it's undefined. The draft is already seeded. */
  onReview: (deckName?: string) => void
}

type FieldSep = 'auto' | 'tab' | 'comma' | 'custom'
type CardSep = 'newline' | 'semicolon' | 'custom'

const FIELD_VALUE: Record<'tab' | 'comma', string> = { tab: '\t', comma: ',' }
const CARD_VALUE: Record<Exclude<CardSep, 'custom'>, string> = { newline: '\n', semicolon: ';' }
const SEP_GLYPH: Record<string, string> = { '\t': '⇥', ',': ',', ';': ';', '|': '|', ' ': '␣' }
const displaySep = (value: string) => SEP_GLYPH[value] ?? value

const PREVIEW_LIMIT = 6

/**
 * The Paste screen: paste any text and it becomes cards. The format (a Bible chapter vs.
 * delimited notes) is auto-detected and overridable; the separators auto-guess but can be
 * tuned, with swap-sides and skip-header options and a live preview of what will be created.
 * "Create" seeds the draft and hands off to the shared review page — nothing is written to
 * the deck until the user confirms there.
 */
export function PasteNotesPage({
  onBack,
  onReview,
  newDeck = false,
  defaultDeckName = '',
}: PasteNotesPageProps) {
  const { t } = useTranslation()
  const setDraft = useImportDraft((s) => s.setDraft)

  const [deckName, setDeckName] = useState(defaultDeckName)
  const [text, setText] = useState('')
  const [override, setOverride] = useState<PasteFormat | null>(null)
  const [fieldSep, setFieldSep] = useState<FieldSep>('auto')
  const [cardSep, setCardSep] = useState<CardSep>('newline')
  const [customField, setCustomField] = useState('')
  const [customCard, setCustomCard] = useState('')
  const [swap, setSwap] = useState(false)
  const [skipHeader, setSkipHeader] = useState(false)

  const detected = useMemo(() => detectPasteFormat(text), [text])
  const format = override ?? detected

  const guessedField = useMemo(() => guessFieldSeparator(text), [text])
  const field =
    fieldSep === 'auto'
      ? guessedField
      : fieldSep === 'custom'
        ? customField
        : FIELD_VALUE[fieldSep]
  const card = cardSep === 'custom' ? customCard || '\n' : CARD_VALUE[cardSep]

  const cards = useMemo(() => {
    if (!text.trim()) return []
    if (format === 'bible') return parseVerses(text)
    if (!field) return []
    return parseDelimitedNotes(text, { field, card, swap, skipHeader })
  }, [text, format, field, card, swap, skipHeader])

  const canReadClipboard =
    typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function'

  const pasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText()
      if (clip.trim()) setText(clip)
    } catch {
      toast.error(t('cards.paste.clipboardError'))
    }
  }

  const namedOk = !newDeck || deckName.trim().length > 0
  const canCreate = cards.length > 0 && namedOk

  const create = () => {
    if (!canCreate) return
    setDraft('paste', cards)
    onReview(newDeck ? deckName.trim() : undefined)
  }

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader title={t('cards.paste.title')} onBack={onBack} backLabel={t('common.back')} />
      }
      footer={
        <div className="bg-glass shrink-0 border-t border-white/40 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_oklch(var(--p-tint-navy)/0.1)]">
          <Button size="lg" className="w-full" disabled={!canCreate} onClick={create}>
            <Sparkles className="size-[18px]" aria-hidden />
            {cards.length > 0 ? t('cards.paste.createCount', { count: cards.length }) : t('cards.paste.create')}
          </Button>
        </div>
      }
    >
      <div className="mt-4 flex flex-col gap-5 pb-6">
        {/* New-deck name — only when creating a deck from the library import; hidden when
            pasting into a deck that already exists. */}
        {newDeck ? (
          <div>
            <span className="mb-2 block text-[length:var(--p-text-sub)] font-bold text-heading">
              {t('cards.paste.deckNameLabel')}
            </span>
            <TextField
              aria-label={t('cards.paste.deckNameLabel')}
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder={t('deck.namePlaceholder')}
              maxLength={60}
            />
          </div>
        ) : null}

        {/* Paste box */}
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
              format === 'bible'
                ? t('cards.paste.biblePlaceholder')
                : t('cards.paste.notesPlaceholder')
            }
            rows={8}
            className="min-h-[184px] font-mono text-[length:var(--p-text-label)] leading-relaxed"
            autoFocus
          />
          <div className="mt-2 flex items-center gap-4">
            {canReadClipboard ? (
              <TextButton icon={<ClipboardPaste className="size-4" aria-hidden />} onClick={pasteFromClipboard}>
                {t('cards.paste.pasteFromClipboard')}
              </TextButton>
            ) : null}
            {text ? (
              <TextButton
                icon={<Eraser className="size-4" aria-hidden />}
                tone="muted"
                onClick={() => setText('')}
              >
                {t('cards.paste.clear')}
              </TextButton>
            ) : null}
          </div>
        </div>

        {/* Format — auto-detected, overridable */}
        <FormatToggle
          value={format}
          auto={override === null}
          onChange={(next) => setOverride(next)}
          onReset={() => setOverride(null)}
        />

        {format === 'bible' ? (
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
                {
                  value: 'auto',
                  label: t('cards.paste.sepAuto'),
                  hint: text.trim() ? displaySep(guessedField) : undefined,
                },
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

            <div className="overflow-hidden rounded-card border border-border bg-card shadow-rest">
              <ToggleRow
                icon={<ArrowUpDown className="size-[18px]" aria-hidden />}
                label={t('cards.paste.swapLabel')}
                hint={t('cards.paste.swapHint')}
                checked={swap}
                onCheckedChange={setSwap}
              />
              <ToggleRow
                icon={<Table className="size-[18px]" aria-hidden />}
                label={t('cards.paste.skipHeaderLabel')}
                hint={t('cards.paste.skipHeaderHint')}
                checked={skipHeader}
                onCheckedChange={setSkipHeader}
                divide
              />
            </div>
          </div>
        )}

        {/* Live preview */}
        {text.trim() ? (
          cards.length > 0 ? (
            <PreviewList cards={cards} />
          ) : (
            <p className="rounded-card bg-secondary/40 px-4 py-3 text-[length:var(--p-text-label)] text-muted-foreground">
              {t('cards.paste.noneParsed')}
            </p>
          )
        ) : null}
      </div>
    </AppScreen>
  )
}

function FormatToggle({
  value,
  auto,
  onChange,
  onReset,
}: {
  value: PasteFormat
  auto: boolean
  onChange: (value: PasteFormat) => void
  onReset: () => void
}) {
  const { t } = useTranslation()
  const options = [
    { value: 'notes' as const, label: t('cards.paste.kindNotes'), icon: List },
    { value: 'bible' as const, label: t('cards.paste.kindBible'), icon: BookOpen },
  ]
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[length:var(--p-text-label)] font-semibold text-heading">
          {t('cards.paste.formatLabel')}
        </span>
        {auto ? (
          <span className="inline-flex items-center gap-1 text-[length:var(--p-text-tiny)] font-semibold text-muted-foreground">
            <Wand2 className="size-3.5" aria-hidden />
            {t('cards.paste.autoDetected')}
          </span>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="text-[length:var(--p-text-tiny)] font-bold text-primary"
          >
            {t('cards.paste.resetAuto')}
          </button>
        )}
      </div>
      <div role="radiogroup" aria-label={t('cards.paste.formatLabel')} className="grid grid-cols-2 gap-2">
        {options.map(({ value: v, label, icon: Icon }) => {
          const selected = v === value
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(v)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-control py-2.5 text-[length:var(--p-text-sub)] font-semibold transition-[background-color,box-shadow,transform] active:scale-[0.98]',
                selected
                  ? 'bg-info-surface text-heading ring-1 ring-inset ring-primary/20 shadow-rest'
                  : 'bg-secondary/40 text-muted-foreground',
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PreviewList({ cards }: { cards: ParsedCard[] }) {
  const { t } = useTranslation()
  const shown = cards.slice(0, PREVIEW_LIMIT)
  const rest = cards.length - shown.length
  return (
    <div>
      <span className="mb-2 block text-[length:var(--p-text-label)] font-semibold text-heading">
        {t('cards.paste.previewLabel')}
      </span>
      <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-card shadow-rest">
        {shown.map((c, i) => (
          <li key={i} className="flex items-center gap-2.5 px-3.5 py-2.5">
            <span className="min-w-0 flex-1 truncate text-[length:var(--p-text-label)] font-semibold text-heading">
              {c.front}
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[length:var(--p-text-label)] text-muted-foreground">
              {c.back}
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <p className="mt-1.5 px-1 text-[length:var(--p-text-label)] text-muted-foreground">
          {t('cards.paste.moreCards', { count: rest })}
        </p>
      ) : null}
    </div>
  )
}

function TextButton({
  icon,
  children,
  tone = 'primary',
  onClick,
}: {
  icon: ReactNode
  children: ReactNode
  tone?: 'primary' | 'muted'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 text-[length:var(--p-text-label)] font-semibold transition-colors active:opacity-70',
        tone === 'primary' ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function ToggleRow({
  icon,
  label,
  hint,
  checked,
  onCheckedChange,
  divide = false,
}: {
  icon: ReactNode
  label: string
  hint: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
  divide?: boolean
}) {
  return (
    <label
      className={cn(
        'flex items-center justify-between gap-3 px-3.5 py-3',
        divide && 'border-t border-border',
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-control bg-info-surface text-primary"
        >
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-[length:var(--p-text-body)] font-semibold text-heading">
            {label}
          </span>
          <span className="block truncate text-[length:var(--p-text-label)] text-muted-foreground">
            {hint}
          </span>
        </span>
      </span>
      <Switch label={label} checked={checked} onCheckedChange={onCheckedChange} />
    </label>
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
                  className="shrink-0 rounded-control bg-primary/[0.06] px-1.5 py-0.5 font-mono text-[length:var(--p-text-label)] text-muted-foreground"
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
