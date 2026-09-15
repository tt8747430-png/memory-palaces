import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { FastOutcome } from '@/entities/card'
import {
  HISTORY_CAP,
  type HistoryEntry,
  historyForCard,
  selectHistory,
  useHistoryStore,
} from '@/entities/learning-history'
import { type Grade, intervalLabel, selectIsReady } from '@/shared/lib'
import { Empty, type PillTone, pillSurface, Sheet, Skeleton } from '@/shared/ui'

export interface LearningHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Null while no card's sheet is open — the sheet still mounts, so it has to answer for that. */
  cardId: string | null
}

/**
 * What each answer is called, and how strongly it reads. Keyed by the union rather than `string`,
 * so adding a Grade or a Fast-review answer without naming it here fails to compile instead of
 * rendering an unlabelled row.
 */
const ANSWER: Record<Grade | FastOutcome, { key: string; tone: PillTone }> = {
  again: { key: 'grade.again', tone: 'danger' },
  hard: { key: 'grade.hard', tone: 'warning' },
  good: { key: 'grade.good', tone: 'success' },
  easy: { key: 'grade.easy', tone: 'info' },
  notQuite: { key: 'fastReview.notQuite', tone: 'danger' },
  gotIt: { key: 'fastReview.gotIt', tone: 'success' },
}

/**
 * Every answer this Card has been given, newest first — the history `gradeCard`, `answerCard` and
 * `markCardsKnown` write, `undoAnswer` takes back and Reset progress clears, so what is listed is
 * what actually stands.
 *
 * The store holds the whole history, so the per-card filter is a `useMemo` over one stable array
 * rather than a selector: a selector building a fresh array would never compare equal to the last
 * one.
 */
export function LearningHistorySheet({ open, onOpenChange, cardId }: LearningHistorySheetProps) {
  const { t } = useTranslation()
  const entries = useHistoryStore(selectHistory)
  const ready = useHistoryStore(selectIsReady)
  const reviews = useMemo(() => (cardId ? historyForCard(entries, cardId) : []), [entries, cardId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('cardActions.historyTitle')}>
      {!ready ? (
        <LoadingRows />
      ) : reviews.length === 0 ? (
        <Empty
          emoji="🕓"
          title={t('cardActions.historyEmpty')}
          description={t('cardActions.historyEmptyBody')}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-label text-muted-foreground">
            {t('cardActions.historyCount', { count: reviews.length })} ·{' '}
            {t('cardActions.historyKept', { count: HISTORY_CAP })}
          </p>
          <ol className="flex flex-col gap-2">
            {reviews.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} t={t} />
            ))}
          </ol>
        </div>
      )}
    </Sheet>
  )
}

/**
 * The store mirrors the collection asynchronously, so "not ready" and "no answers yet" are two
 * different things and only one of them is news. Showing the empty state for both told a learner
 * with a long history that they had none.
 */
function LoadingRows() {
  return (
    <div aria-hidden className="flex flex-col gap-2">
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-16 rounded-card" />
      ))}
    </div>
  )
}

function HistoryRow({ entry, t }: { entry: HistoryEntry; t: TFunction }) {
  const answer = entry.grade ? ANSWER[entry.grade] : entry.outcome ? ANSWER[entry.outcome] : null
  return (
    <li className="flex items-center justify-between gap-3 rounded-card bg-info-surface px-4 py-2.5">
      <span className="flex min-w-0 flex-col items-start gap-1">
        <span className={pillSurface(answer ? answer.tone : 'primary')}>
          {answer ? t(answer.key as never) : t('cardActions.historyMastered')}
        </span>
        <time dateTime={entry.createdAt} className="text-label text-muted-foreground">
          {new Date(entry.createdAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </time>
      </span>
      <span className="shrink-0 text-label font-semibold text-heading">
        {scheduleMove(entry, t)}
      </span>
    </li>
  )
}

/**
 * What the answer did to the schedule. A Fast-review answer has none to report, and a Card seen for
 * the first time has no interval to have come from — both say so rather than printing a bare
 * `0d → 1d`.
 *
 * The first-review test is `intervalBefore === undefined`, not falsiness. `schedule()` zeroes the
 * interval on `again`, so a falsy test called every answer after a lapse a first review, and two
 * lapses in a row both read "First review · now".
 */
function scheduleMove(entry: HistoryEntry, t: TFunction): string {
  if (entry.kind === 'answered') return t('cardActions.historyFast')
  const to = intervalLabel(entry.intervalAfter ?? 0)
  if (entry.intervalBefore === undefined) return `${t('cardActions.historyFirstReview')} · ${to}`
  return t('cardActions.historyInterval', { from: intervalLabel(entry.intervalBefore), to })
}
