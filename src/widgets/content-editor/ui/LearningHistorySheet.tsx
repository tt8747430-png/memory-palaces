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
  cardId: string | null
}

const ANSWER: Record<Grade | FastOutcome, { key: string; tone: PillTone }> = {
  again: { key: 'grade.again', tone: 'danger' },
  hard: { key: 'grade.hard', tone: 'warning' },
  good: { key: 'grade.good', tone: 'success' },
  easy: { key: 'grade.easy', tone: 'info' },
  notQuite: { key: 'fastReview.notQuite', tone: 'danger' },
  gotIt: { key: 'fastReview.gotIt', tone: 'success' },
}

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

function scheduleMove(entry: HistoryEntry, t: TFunction): string {
  if (entry.kind === 'answered') return t('cardActions.historyFast')
  const to = intervalLabel(entry.intervalAfter ?? 0)
  if (entry.intervalBefore === undefined) return `${t('cardActions.historyFirstReview')} · ${to}`
  return t('cardActions.historyInterval', { from: intervalLabel(entry.intervalBefore), to })
}
