import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays } from 'lucide-react'
import type { Card, FastOutcome } from '@/entities/card'
import type { LearningAlgorithm } from '@/entities/deck'
import {
  type CardProgressDraft,
  cn,
  FAST_OUTCOMES,
  daysUntilDue,
  DEFAULT_EASE,
  draftDiffersFromCard,
  draftFrom,
  draftSchedule,
  draftStatus,
  intervalLabel,
  type SrsStatus,
  withDue,
  withGrade,
  withStatus,
} from '@/shared/lib'
import { Button, GradeButtons, SegmentedControl, Sheet, SrsStatusChip } from '@/shared/ui'
import type { CardProgressChange } from '../model/card-progress-change'

const STATUSES: readonly SrsStatus[] = ['new', 'learning', 'known']

const OUTCOME_TONE: Record<FastOutcome, string> = {
  notQuite: 'bg-(--danger-surface) text-(--danger-on-surface)',
  gotIt: 'bg-(--success-surface) text-(--success-on-surface)',
}

export interface CardProgressSheetProps {
  /** Mounted only while the drawer is open, so the draft starts from this card. */
  card: Card
  algorithm: LearningAlgorithm
  onOpenChange: (open: boolean) => void
  onApply: (change: CardProgressChange) => void
}

export function CardProgressSheet(props: CardProgressSheetProps) {
  return props.algorithm === 'fast' ? <FastProgress {...props} /> : <ScheduleProgress {...props} />
}

/** A day, in the `yyyy-mm-dd` shape a date input reads and writes. */
function dayValue(ms: number): string {
  const local = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function dayStart(value: string): number | null {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day, 12).getTime()
}

function ScheduleProgress({ card, onOpenChange, onApply }: CardProgressSheetProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<CardProgressDraft>(() => draftFrom(card.srs, Date.now()))

  const srs = draftSchedule(draft)
  const days = srs ? daysUntilDue(srs, draft.at) : 0

  return (
    <ProgressShell
      card={card}
      canApply={draftDiffersFromCard(draft)}
      onOpenChange={onOpenChange}
      onApply={() => onApply({ kind: 'schedule', srs, grade: draft.grade })}
      footnote={
        <>
          <SrsStatusChip srs={srs} />
          <p className="text-label tabular-nums text-muted-foreground">
            {t('cardProgress.statsLabel', {
              reps: srs?.reps ?? 0,
              lapses: srs?.lapses ?? 0,
              ease: (srs?.ease ?? DEFAULT_EASE).toFixed(2),
            })}
          </p>
        </>
      }
    >
      <Field label={t('cardProgress.statusLabel')}>
        <SegmentedControl
          aria-label={t('cardProgress.statusLabel')}
          value={draftStatus(draft)}
          size="sm"
          onChange={(next) => setDraft(withStatus(draft, next))}
          options={STATUSES.map((value) => ({ value, label: t(`srs.${value}`) }))}
        />
        {draftStatus(draft) === 'new' ? (
          <p className="text-label leading-relaxed text-muted-foreground">
            {t('cardProgress.newHint')}
          </p>
        ) : null}
      </Field>

      <Field label={t('cardProgress.gradeLabel')} hint={t('cardProgress.gradeHint')}>
        <GradeButtons
          srs={draft.shaped}
          now={draft.at}
          selected={draft.grade}
          onGrade={(grade) => setDraft(withGrade(draft, grade))}
        />
      </Field>

      <Field label={t('cardProgress.dueLabel')}>
        <label className="flex items-center justify-between gap-3 rounded-card bg-info-surface px-4 py-3">
          <span className="flex min-w-0 items-center gap-3 text-heading">
            <CalendarDays className="size-4.5 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="block text-body font-semibold">
                {srs && days > 0
                  ? t('cardProgress.dueIn', { interval: intervalLabel(days) })
                  : t('cardProgress.dueToday')}
              </span>
              <span className="block text-label text-muted-foreground">
                {t('cardProgress.duePick')}
              </span>
            </span>
          </span>
          <input
            type="date"
            aria-label={t('cardProgress.dueLabel')}
            min={dayValue(draft.at)}
            value={dayValue(srs ? Date.parse(srs.due) : draft.at)}
            onChange={(event) => {
              const picked = dayStart(event.target.value)
              if (picked !== null) setDraft(withDue(draft, picked))
            }}
            className="shrink-0 rounded-control bg-card px-3 py-2 text-label font-semibold tabular-nums text-heading shadow-rest transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </Field>
    </ProgressShell>
  )
}

/** A fast deck keeps no schedule — the only thing to set is the last outcome. */
function FastProgress({ card, onOpenChange, onApply }: CardProgressSheetProps) {
  const { t } = useTranslation()
  const [outcome, setOutcome] = useState<FastOutcome | undefined>(card.fastReview)

  return (
    <ProgressShell
      card={card}
      canApply={outcome !== undefined && outcome !== card.fastReview}
      onOpenChange={onOpenChange}
      onApply={() => outcome && onApply({ kind: 'fastReview', outcome })}
      footnote={
        <p className="text-label leading-relaxed text-muted-foreground">
          {t('cardProgress.fastHint')}
        </p>
      }
    >
      <Field label={t('cardProgress.gradeLabel')}>
        <div className="grid grid-cols-2 gap-2">
          {FAST_OUTCOMES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={outcome === value}
              onClick={() => setOutcome(value)}
              className={cn(
                'flex min-h-12 items-center justify-center rounded-control px-2 py-2',
                'text-label font-semibold transition-transform duration-150 ease-out active:scale-[0.96]',
                OUTCOME_TONE[value],
                outcome === value && 'ring-2 ring-accent ring-offset-2 ring-offset-card',
              )}
            >
              {t(`fastReview.${value}`)}
            </button>
          ))}
        </div>
      </Field>
    </ProgressShell>
  )
}

function ProgressShell({
  card,
  canApply,
  onOpenChange,
  onApply,
  footnote,
  children,
}: {
  card: Card
  canApply: boolean
  onOpenChange: (open: boolean) => void
  onApply: () => void
  footnote: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <Sheet
      open
      onOpenChange={onOpenChange}
      size="tall"
      title={t('cardProgress.title')}
      description={card.front}
      footer={
        <Button
          className="w-full"
          disabled={!canApply}
          onClick={() => {
            onApply()
            onOpenChange(false)
          }}
        >
          {t('cardProgress.apply')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        {children}
        <div className="flex flex-wrap items-center gap-2">{footnote}</div>
      </div>
    </Sheet>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-label font-bold text-heading">{label}</h3>
      {children}
      {hint ? <p className="text-label leading-relaxed text-muted-foreground">{hint}</p> : null}
    </section>
  )
}
