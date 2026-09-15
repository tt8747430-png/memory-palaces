import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CONTENT_COLLECTIONS, contentKey } from '@/shared/config/sync-tables'
import {
  type SyncReviewItem,
  type SyncReviewRow,
  type SyncReviewRows,
  useSyncRunner,
} from '@/shared/lib'
import { Button, SegmentedControl, Sheet, Skeleton } from '@/shared/ui'

type Answer = 'delete' | 'keep'

const LOADING: SyncReviewRows = { state: 'loading' }
const NONE_KEPT: ReadonlySet<string> = new Set()

export function SyncReviewDialog() {
  const { t } = useTranslation()
  const runner = useSyncRunner()
  const review = runner?.review ?? null
  const rows = review?.rows ?? LOADING

  const [answers, setAnswers] = useState<{
    items: SyncReviewItem[] | null
    kept: ReadonlySet<string>
  }>({
    items: null,
    kept: NONE_KEPT,
  })
  const kept = review && answers.items === review.items ? answers.kept : NONE_KEPT

  const groups = useMemo(() => {
    if (rows.state !== 'ready') return []
    return CONTENT_COLLECTIONS.flatMap((collection) => {
      const found = rows.rows.filter((row) => row.collection === collection)
      return found.length ? [{ collection, rows: found }] : []
    })
  }, [rows])

  const answer = (row: SyncReviewRow, next: Answer) => {
    if (!review) return
    const updated = new Set(kept)
    const key = contentKey(row.collection, row.id)
    if (next === 'keep') updated.add(key)
    else updated.delete(key)
    setAnswers({ items: review.items, kept: updated })
  }

  const decide = (keepAll: boolean) =>
    rows.state === 'ready'
      ? rows.rows.map((row) => ({
          ...row,
          keep: keepAll || kept.has(contentKey(row.collection, row.id)),
        }))
      : []

  const ready = rows.state === 'ready'
  const empty = ready && rows.rows.length === 0

  return (
    <Sheet
      open={Boolean(review)}
      onOpenChange={(open) => {
        if (!open) runner?.dismiss()
      }}
      title={t('sync.review.title')}
      description={t('sync.review.body', { count: review?.items.length ?? 0 })}
      footer={
        empty ? (
          <Button size="lg" className="w-full" onClick={() => void runner?.resolve([])}>
            {t('sync.review.continue')}
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              className="w-full"
              disabled={!ready}
              onClick={() => void runner?.resolve(decide(false))}
            >
              {t('sync.review.apply')}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full"
              disabled={!ready}
              onClick={() => void runner?.resolve(decide(true))}
            >
              {t('sync.review.keepAll')}
            </Button>
          </div>
        )
      }
    >
      {rows.state === 'loading' ? (
        <div role="status" className="flex flex-col gap-2 py-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : rows.state === 'failed' ? (
        <div role="alert" className="flex flex-col items-start gap-3 py-2">
          <p className="text-label leading-snug text-(--danger-on-surface)">
            {t('sync.review.loadFailed')}
          </p>
          <Button variant="secondary" onClick={() => runner?.reloadReview()}>
            {t('sync.review.retry')}
          </Button>
        </div>
      ) : empty ? (
        <p className="py-2 text-label leading-snug text-muted-foreground">
          {t('sync.review.nothingLeft')}
        </p>
      ) : (
        <div className="flex flex-col gap-5 py-1">
          {groups.map((group) => (
            <section key={group.collection} className="flex flex-col gap-2">
              <h3 className="text-label font-semibold text-muted-foreground">
                {t(`sync.review.group.${group.collection}`)}
              </h3>
              <ul className="flex flex-col gap-2">
                {group.rows.map((row) => {
                  const key = contentKey(row.collection, row.id)
                  const affected = row.descendants?.length ?? 0
                  return (
                    <li key={key} className="flex flex-col gap-2 rounded-card bg-info-surface p-3">
                      <div className="min-w-0">
                        <p className="truncate text-body font-semibold text-heading">{row.label}</p>
                        {affected ? (
                          <p className="text-label text-muted-foreground">
                            {t('sync.review.alsoChanged', { count: affected })}
                          </p>
                        ) : null}
                      </div>
                      <SegmentedControl<Answer>
                        aria-label={t('sync.review.decide')}
                        value={kept.has(key) ? 'keep' : 'delete'}
                        onChange={(next) => answer(row, next)}
                        options={[
                          { value: 'delete', label: t('sync.review.delete') },
                          { value: 'keep', label: t('sync.review.keep') },
                        ]}
                      />
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Sheet>
  )
}
