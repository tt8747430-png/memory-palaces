import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeftRight,
  BookOpen,
  Check,
  Layers,
  Minus,
  Plus,
  RotateCcw,
  Shuffle,
  Volume2,
} from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button, Sheet } from '@/shared/ui'
import {
  type CardOrder,
  type RangeBatch,
  type Scope,
  type ScopeCounts,
  scopesEqual,
} from '@/features/review'
import type { StudyDirection } from '../model/types'

export interface StudyOptionsSheetProps {
  open: boolean
  onClose: () => void
  mode: 'review' | 'browse'
  scope: Scope
  scopeCounts: ScopeCounts
  batches: RangeBatch[]
  direction: StudyDirection
  order: CardOrder
  shuffle: boolean
  textToSpeech: boolean
  sortIntoPiles: boolean
  canSpeak: boolean
  allowBrowse: boolean
  allowScope: boolean
  onScope: (scope: Scope) => void
  onMode: (mode: 'review' | 'browse') => void
  onDirection: (direction: StudyDirection) => void
  onOrder: (order: CardOrder) => void
  onShuffle: (value: boolean) => void
  onTextToSpeech: (value: boolean) => void
  onSortIntoPiles: (value: boolean) => void
  onRestart: () => void
  onFinish: () => void
}

/** The full study-options sheet: which cards to study (filters + ranges), general
 * toggles, the simple-sort switch, card orientation, and review/browse mode. */
export function StudyOptionsSheet({
  open,
  onClose,
  mode,
  scope,
  scopeCounts,
  batches,
  direction,
  order,
  shuffle,
  textToSpeech,
  sortIntoPiles,
  canSpeak,
  allowBrowse,
  allowScope,
  onScope,
  onMode,
  onDirection,
  onOrder,
  onShuffle,
  onTextToSpeech,
  onSortIntoPiles,
  onRestart,
  onFinish,
}: StudyOptionsSheetProps) {
  const { t } = useTranslation()

  const filters: { scope: Scope; label: string; count: number }[] = [
    { scope: { kind: 'all' }, label: t('study.filterAll'), count: scopeCounts.all },
    { scope: { kind: 'due' }, label: t('study.filterDue'), count: scopeCounts.due },
    { scope: { kind: 'new' }, label: t('study.filterNew'), count: scopeCounts.new },
    { scope: { kind: 'learning' }, label: t('study.filterLearning'), count: scopeCounts.learning },
    { scope: { kind: 'flagged' }, label: t('study.filterFlagged'), count: scopeCounts.flagged },
  ]

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t('study.optionsTitle')}
      footer={
        <div className="flex gap-2.5">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              onRestart()
              onClose()
            }}
          >
            <RotateCcw className="size-[18px]" aria-hidden />
            {t('study.restart')}
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onFinish()
              onClose()
            }}
          >
            <Check className="size-[18px]" aria-hidden />
            {t('study.finish')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {allowScope && (
          <Section title={t('study.cardsToStudy')}>
            <div className="flex flex-wrap gap-2">
              {filters.map(
                ({ scope: candidate, label, count }) =>
                  (candidate.kind === 'all' || count > 0) && (
                    <ScopeChip
                      key={candidate.kind}
                      label={label}
                      count={count}
                      active={scopesEqual(scope, candidate)}
                      onClick={() => onScope(candidate)}
                    />
                  ),
              )}
            </div>
            {(batches.length > 0 || scopeCounts.all > 1) && (
              <div className="space-y-2 pt-1">
                <p className="px-1 text-[length:var(--p-text-label)] font-semibold text-heading">
                  {t('study.byRange')}
                </p>
                {batches.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {batches.map((batch) => (
                      <ScopeChip
                        key={batch.label}
                        label={batch.label}
                        active={
                          scope.kind === 'range' &&
                          scope.start === batch.start &&
                          scope.end === batch.end
                        }
                        onClick={() =>
                          onScope({ kind: 'range', start: batch.start, end: batch.end })
                        }
                      />
                    ))}
                  </div>
                )}
                <CustomRange
                  total={scopeCounts.all}
                  scope={scope}
                  batches={batches}
                  onScope={onScope}
                />
              </div>
            )}
          </Section>
        )}

        <Section title={t('study.general')}>
          <ToggleRow
            icon={<Shuffle className="size-[18px]" aria-hidden />}
            label={t('study.shuffle')}
            description={t('study.shuffleHint')}
            checked={shuffle}
            onChange={onShuffle}
          />
          <ToggleRow
            icon={<Volume2 className="size-[18px]" aria-hidden />}
            label={t('study.textToSpeech')}
            description={canSpeak ? t('study.ttsHint') : t('study.ttsUnsupported')}
            checked={textToSpeech}
            onChange={onTextToSpeech}
            disabled={!canSpeak}
          />
        </Section>

        <ToggleRow
          icon={<Layers className="size-[18px]" aria-hidden />}
          label={t('study.simpleSort')}
          description={t('study.simpleSortHint')}
          checked={sortIntoPiles}
          onChange={onSortIntoPiles}
        />

        <Section title={t('study.orientation')}>
          <SegmentedControl
            value={direction}
            options={[
              { value: 'front', label: t('study.orientationTerm') },
              { value: 'back', label: t('study.orientationDefinition') },
            ]}
            onChange={onDirection}
          />
        </Section>

        {allowBrowse && (
          <Section title={t('study.mode')}>
            <SegmentedControl
              value={mode}
              options={[
                { value: 'review', label: t('study.modeReview') },
                { value: 'browse', label: t('study.modeBrowse') },
              ]}
              onChange={onMode}
            />
            {mode === 'browse' && (
              <div className="pt-1">
                <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[length:var(--p-text-label)] font-semibold text-heading">
                  <ArrowLeftRight className="size-3.5" aria-hidden />
                  {t('study.cardOrder')}
                </p>
                <SegmentedControl
                  value={order}
                  options={[
                    { value: 'inOrder', label: t('study.orderInOrder') },
                    { value: 'shuffle', label: t('study.orderShuffle') },
                    { value: 'reverse', label: t('study.orderReverse') },
                  ]}
                  onChange={onOrder}
                />
              </div>
            )}
            <p className="flex items-center gap-1.5 px-1 pt-1 text-[length:var(--p-text-label)] text-muted-foreground">
              <BookOpen className="size-3.5" aria-hidden />
              {mode === 'review' ? t('study.reviewModeHint') : t('study.browseModeHint')}
            </p>
          </Section>
        )}
      </div>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[length:var(--p-text-label)] font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  )
}

function ScopeChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[length:var(--p-text-label)] font-semibold transition-transform active:scale-[0.94]',
        active ? 'bg-primary text-primary-foreground' : 'bg-info-surface text-info-foreground',
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            'text-[length:var(--p-text-tiny)] font-bold',
            active ? 'opacity-70' : 'opacity-60',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-card bg-info-surface p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-control px-2 py-2.5 text-[length:var(--p-text-label)] font-semibold transition-colors',
              active ? 'bg-card text-heading shadow-rest' : 'text-muted-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: ReactNode
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-card bg-info-surface px-4 py-3 text-left transition-transform active:scale-[0.99]',
        disabled && 'opacity-50',
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="text-heading">{icon}</span>
        <span className="min-w-0">
          <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
            {label}
          </span>
          {description && (
            <span className="mt-0.5 block text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
              {description}
            </span>
          )}
        </span>
      </span>
      <span
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-[color-mix(in_oklch,var(--text-muted)_32%,transparent)]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 block size-6 rounded-full bg-card shadow-rest transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}

const clampRange = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value))

function RangeStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex-1">
      <p className="mb-1 px-0.5 text-[length:var(--p-text-label)] font-semibold text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center overflow-hidden rounded-control border border-border bg-card">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`${label} −`}
          className="grid size-11 shrink-0 place-items-center text-heading disabled:opacity-30"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <input
          type="number"
          inputMode="numeric"
          aria-label={label}
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-11 w-full min-w-0 bg-transparent text-center text-[length:var(--p-text-body)] font-bold text-heading outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`${label} +`}
          className="grid size-11 shrink-0 place-items-center text-heading disabled:opacity-30"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

function CustomRange({
  total,
  scope,
  batches,
  onScope,
}: {
  total: number
  scope: Scope
  batches: RangeBatch[]
  onScope: (scope: Scope) => void
}) {
  const { t } = useTranslation()
  const matchesPreset =
    scope.kind === 'range' && batches.some((b) => b.start === scope.start && b.end === scope.end)
  const active = scope.kind === 'range' && !matchesPreset

  const [from, setFrom] = useState(() => (active && scope.kind === 'range' ? scope.start + 1 : 1))
  const [to, setTo] = useState(() =>
    active && scope.kind === 'range' ? scope.end : Math.min(total, 10),
  )

  const apply = (nextFrom: number, nextTo: number) => {
    const f = clampRange(Math.round(nextFrom) || 1, 1, total)
    const u = clampRange(Math.round(nextTo) || f, f, total)
    setFrom(f)
    setTo(u)
    onScope({ kind: 'range', start: f - 1, end: u })
  }

  const safeFrom = clampRange(from, 1, total)
  const safeTo = clampRange(to, safeFrom, total)
  const count = safeTo - safeFrom + 1

  return (
    <div
      className={cn(
        'rounded-card border p-3 transition-colors',
        active ? 'border-secondary/40 bg-info-surface' : 'border-border bg-card',
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[length:var(--p-text-label)] font-semibold text-heading">
          {t('study.customRange')}
        </p>
        <span className="text-[length:var(--p-text-tiny)] font-bold text-accent">
          {t(count === 1 ? 'study.rangeCardsOne' : 'study.rangeCardsOther', { count })}
        </span>
      </div>
      <div className="flex items-end gap-2.5">
        <RangeStepper
          label={t('study.rangeFrom')}
          value={safeFrom}
          min={1}
          max={total}
          onChange={(v) => apply(v, Math.max(v, safeTo))}
        />
        <span className="pb-2.5 text-[length:var(--p-text-label)] font-semibold text-muted-foreground">
          {t('study.rangeTo').toLowerCase()}
        </span>
        <RangeStepper
          label={t('study.rangeTo')}
          value={safeTo}
          min={safeFrom}
          max={total}
          onChange={(v) => apply(safeFrom, v)}
        />
      </div>
    </div>
  )
}
